import { Point, Hash } from "../types.js";
import { decide, pick, wait } from "../utils.js";
import { getRandomRoadNode } from "../map.js";
import { getClient, pointValue, convertToPoint } from "../db.js";
import { destinationGenerator, dispatcher } from "../processes/index.js";
import Driver, { drivers } from "./Driver.js";

const refreshInterval = 500;
const spawnProbability = 5;
const cancelProbability = 1;
const maxActiveCustomers = 18;
const activeCustomers = new Set<string>();

const activationGuard = () => activeCustomers.size < maxActiveCustomers;

interface CustomerRecord {
  id: string;
  name: string;
  active: boolean;
  location: string;
  destination: string;
  driver_id: string;
}

export default class Customer {
  public id!: string;
  public name!: string;
  public active = false;
  private _location: Point | null = null;
  private _destination: Point | null = null;
  public driverId: string | null = null;

  private driverRequested = false;

  constructor(record: CustomerRecord) {
    Object.assign(this, record);
  }

  static async all() {
    const client = getClient();
    const res = await client.query<CustomerRecord>("SELECT * FROM customers");
    return res.rows.map((record) => new Customer(record));
  }

  public get status(): string {
    if (this.driverId) return "matched";
    if (!this.active) return "inactive";
    if (!this.destination) return "planning";
    if (!this.driverRequested) return "unmatched";
    if (!this.driverId) return "matching";

    return "error";
  }

  async simulate() {
    while (true) {
      if (this.status === "inactive") {
        if (decide(spawnProbability) && activationGuard()) this.spawn();
      } else {
        if (decide(cancelProbability)) this.cancel();
      }

      if (this.status === "planning") this.requestDestination();

      if (this.status === "unmatched") this.requestDriver();

      await wait(refreshInterval);
    }
  }

  private async update() {
    const res = await getClient().query(
      `
      UPDATE customers
      SET name = $1,
      active = $2,
      location = $3,
      destination = $4,
      driver_id = $5
      WHERE id = $6
      `,
      [
        this.name,
        this.active,
        pointValue(this.location),
        pointValue(this.destination),
        this.driverId,
        this.id,
      ]
    );

    if (res.rowCount !== 1) console.error(res);

    return res;
  }

  private requestDestination() {
    destinationGenerator.send(pick(this, ["id", "location"]));
  }

  private reset() {
    this.active = false;
    this.location = null;
    this.destination = null;
    this.driverRequested = false;
    this.driverId = null;
    this.update();

    activeCustomers.delete(this.id);
  }

  private log(symbol: string, ...args: any[]) {
    console.log("[C]", symbol, this.name, ...args);
  }

  // ---------- state event handlers ----------

  private spawn() {
    this.active = true;
    this.location = getRandomRoadNode();
    this.update();

    activeCustomers.add(this.id);
    this.requestDestination();
    this.log("✨", "spawns at", this.location);
  }

  private requestDriver() {
    this.log("🙋", "requests driver");
    this.driverRequested = true;
    dispatcher.send({
      event: "requestDriver",
      data: pick(this, ["id", "name", "location"]),
    });
  }

  public match(driver: Driver) {
    this.driverId = driver.id;
    this.update();
  }

  public pickup() {
    // no updates required
  }

  public dropoff() {
    this.reset();
  }

  private cancel() {
    if (this.driverId) {
      drivers[this.driverId].cancel(this.id);
    }

    dispatcher.send({
      event: "cancel",
      data: pick(this, ["id", "name", "location"]),
    });

    this.log("❌", "cancels");
    this.reset();
  }

  public setDestination(destination: Point) {
    this.destination = destination;
    this.update();
  }

  // ---------- getters and setters ----------

  public get location(): Point | null {
    return this._location;
  }

  public set location(value: string | Point | null) {
    this._location = convertToPoint(value);
  }

  public get destination(): Point | null {
    return this._destination;
  }

  public set destination(value: string | Point | null) {
    this._destination = convertToPoint(value);
  }

  // alias, to handle snake-cased db column
  public set driver_id(value: string | null) {
    this.driverId = value;
  }
}

export let customers: Hash<Customer> = {};

export async function loadCustomers(simulate = true) {
  customers = (await Customer.all()).reduce(
    (hash: Hash<Customer>, customer) => {
      hash[customer.id!] = customer;
      if (customer.active) activeCustomers.add(customer.id);
      if (simulate) customer.simulate();
      return hash;
    },
    {}
  );
}

destinationGenerator.on(
  "message",
  ({ id, destination }: { id: string; destination: Point }) => {
    if (customers[id].status === "planning")
      customers[id].setDestination(destination);
  }
);

interface DispatcherMessage {
  event: "match";
  customerId: string;
  driverId: string;
}

dispatcher.on("message", ({ customerId, driverId }: DispatcherMessage) => {
  const customer = customers[customerId];
  const driver = drivers[driverId];

  customer.match(driver);
  driver.match(customer);
});
