import { createHash } from "node:crypto";
import {
  getClient,
  pathValue,
  pointValue,
  convertToPath,
  convertToPoint,
} from "../db.js";
import { Path, Point, Hash } from "../types.js";
import { decide, pick, wait } from "../utils.js";
import { dispatcher } from "../processes/index.js";
import { getRandomRoadNode, getShortestPath, gridCount } from "../map.js";
import Customer, { customers } from "./Customer.js";

const refreshInterval = 250;

interface DriverRecord {
  id: string;
  name: string;
  status: string;
  location: string;
  path: string;
  path_index: number;
  customer_id: string;
  customer_name: string;
}

export default class Driver {
  public id!: string;
  public name!: string;
  public rideStatus = "idle";
  public _location: Point | null = null;
  public _path: Path | null = null;
  public pathIndex: number | null = null;
  public customerId: string | null = null;
  public customerName: string | null = null;

  private customerRequested = false;

  constructor(record: DriverRecord) {
    Object.assign(this, record);
    this.location ||= getRandomRoadNode();
  }

  static async all() {
    const client = getClient();
    const res = await client.query<DriverRecord>("SELECT * FROM drivers");
    return res.rows.map((record) => new Driver(record));
  }

  public get status() {
    if (
      this.rideStatus === "idle" &&
      !this.customerRequested &&
      !this.customerId
    )
      return "off";

    return this.rideStatus;
  }

  async simulate() {
    while (true) {
      if (this.status === "off") {
        this.requestCustomer();
      }

      if (["pickup", "enroute"].includes(this.status)) this.move();

      await wait(refreshInterval);
    }
  }

  private async update() {
    const res = await getClient().query(
      `
      UPDATE drivers
      SET location = $1,
      path = $2,
      path_index = $3,
      path_length = $4,
      path_digest = $5,
      customer_id = $6,
      customer_name = $7,
      ride_status = $8
      WHERE id = $9
      `,
      [
        pointValue(this.location),
        pathValue(this.path),
        this.pathIndex,
        this.pathLength,
        this.pathDigest,
        this.customerId,
        this.customerName,
        this.rideStatus,
        this.id,
      ]
    );

    if (res.rowCount !== 1) console.error(res);

    return res;
  }

  private log(symbol: string, ...args: any[]) {
    console.log("[D]", symbol, this.name, ...args);
  }

  private reset() {
    this.rideStatus = "idle";
    this.customerId = null;
    this.customerName = null;
    this.path = null;
    this.pathIndex = null;
    this.update();
    this.customerRequested = false;
  }

  private move() {
    if (this.path) {
      if (this.pathIndex === this.path.length - 1) {
        if (this.status === "pickup") this.pickup();
        else if (this.status === "enroute") this.dropoff();
      } else {
        this.pathIndex!++;
        this.location = this.path[this.pathIndex!];
        this.update();
      }
    } else {
      // TODO generate proper path to pickup point in child process
      const c = customers[this.customerId!];
      const endPoint = this.status === "pickup" ? c.location : c.destination;
      this.path = getShortestPath(this.location!, endPoint!);
      this.pathIndex = 0;
      this.log("🧭", "now has route to", endPoint);
      this.update();
    }
  }

  // ---------- state event handlers ----------

  private requestCustomer() {
    this.customerRequested = true;
    dispatcher.send({
      event: "requestCustomer",
      data: pick(this, ["id", "name", "location"]),
    });
    this.log("🙋", "requests customer from", this.location);
  }

  public match(customer: Customer) {
    this.customerId = customer.id;
    this.customerName = customer.name;
    this.rideStatus = "pickup";
    this.update();
    this.log("🤝", "matches with", this.customerName);
  }

  private pickup() {
    this.log("⬆️ ", "picks up", this.customerName, "at", this.location);
    this.rideStatus = "enroute";
    this.path = null;
    this.pathIndex = null;
    this.update();
  }

  private dropoff() {
    this.log("⬇️ ", "drops off", this.customerName, "at", this.location);
    customers[this.customerId!].dropoff();
    this.reset();
  }

  public cancel(customerId: string) {
    if (this.customerId === customerId) {
      this.log("❌", `canceled by ${this.customerName}`);
      this.reset();
    }
  }

  // ---------- getters and setters ----------

  public get location(): Point | null {
    return this._location;
  }

  public set location(value: string | Point | null) {
    this._location = convertToPoint(value);
  }

  public get path(): Path | null {
    return this._path;
  }

  public set path(value: string | Path | null) {
    this._path = convertToPath(value);
  }

  // aliases, to handle snake-cased db columns in Object.assign
  public set ride_status(rideStatus: string) {
    this.rideStatus = rideStatus;
  }

  public set path_index(pathIndex: number | null) {
    this.pathIndex = pathIndex;
  }

  public set customer_id(customerId: string | null) {
    this.customerId = customerId;
  }

  public set customer_name(customerName: string | null) {
    this.customerName = customerName;
  }

  // computed path properties for easier path handling in frontend
  public get pathLength(): number | null {
    return this.path ? this.path.length : null;
  }

  public get pathDigest(): string | null {
    if (!this.path) return null;

    const hash = createHash("sha256");
    hash.update(this.path.toString());
    return hash.digest("hex");
  }
}

export let drivers: Hash<Driver> = {};

export async function loadDrivers(simulate = true) {
  drivers = (await Driver.all()).reduce((hash: Hash<Driver>, driver) => {
    hash[driver.id!] = driver;
    if (simulate) driver.simulate();

    return hash;
  }, {});
}
