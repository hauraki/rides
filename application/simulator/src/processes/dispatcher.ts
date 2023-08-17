import { wait } from "../utils.js";
import { Point } from "../types.js";
import { getStraightLineDistance } from "../map.js";

interface CustomerData {
  id: string;
  name: string;
  location: Point;
}

interface DriverData {
  id: string;
  name: string;
  location: Point;
}

interface CustomerMessage {
  event: "requestDriver" | "cancel";
  data: CustomerData;
}

interface DriverMessage {
  event: "requestCustomer";
  data: DriverData;
}

const customers: CustomerData[] = [];
const drivers: DriverData[] = [];

const log = (...args: any[]) => false && console.log("[DIS]", ...args);

process.on("message", ({ event, data }: CustomerMessage | DriverMessage) => {
  if (event === "requestCustomer") {
    drivers.push(data);
    log("+", data.name);
  } else if (event === "requestDriver") {
    customers.push(data);
    log("+", data.name);
  } else if (event === "cancel") {
    const index = customers.findIndex((c) => c.id === data.id);
    customers.splice(index, 1);
    log("-", data.name, "(canceled)");
  }
});

while (true) {
  await wait(500);
  if (customers.length && drivers.length) {
    const customer = customers.shift()!;

    drivers.sort(
      (a, b) =>
        getStraightLineDistance(a.location, customer.location) -
        getStraightLineDistance(b.location, customer.location)
    );

    const matchedDriver = drivers.pop()!;

    const distance = Math.floor(
      getStraightLineDistance(matchedDriver.location, customer.location)
    );

    log("-", matchedDriver.name);
    log("-", customer.name);

    process.send!({
      event: "match",
      customerId: customer.id,
      driverId: matchedDriver.id,
    });
  }

  if (customers.length) continue;
  else await wait(1000);
}
