import { connectClient } from "./db.js";
import prepareDatabase from "./data/prepareDatabase.js";
import { loadCustomers } from "./models/Customer.js";
import { loadDrivers } from "./models/Driver.js";

console.log("starting");

await connectClient();
await prepareDatabase();
await loadCustomers();
await loadDrivers();

console.log("customers and drivers loaded successfully");

process.on("SIGINT", function () {
  console.log("exiting");
  process.exit();
});
