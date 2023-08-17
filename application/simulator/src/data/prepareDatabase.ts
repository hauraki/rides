// create tables and populate them with some data
// the approach taken here works and is idempotent,
// but not a migration strategy for production systems

import { getClient } from "../db.js";

let schema = `
  CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    active BOOLEAN,
    location POINT,
    destination POINT,
    driver_id UUID UNIQUE
  );

  /* CREATE TYPE does not support the IF NOT EXISTS clause, so we need to
  * catch the exception and ignore it. */
  DO $$ BEGIN
      CREATE TYPE status_enum AS ENUM ('idle', 'pickup', 'enroute');
  EXCEPTION
      WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    ride_status status_enum NOT NULL DEFAULT 'idle',
    location POINT,
    path PATH,
    path_index INTEGER,
    customer_id uuid UNIQUE,
    customer_name VARCHAR(255),
    path_length INTEGER,
    path_digest VARCHAR(100)
  );
`;

export default async function () {
  const client = await getClient();
  let customerInserts: any = [],
    driverInserts: any = [];

  // create tables and types
  await client.query(schema);

  // reset customers, if requested
  if (process.env.RESET_CUSTOMERS == "true") {
    console.log("resetting customers");
    await client.query("DELETE FROM customers");
  }

  // populate customers table, if still empty
  const customerCount = (await client.query("SELECT COUNT(*) FROM customers"))
    .rows[0].count;
  if (customerCount == 0) {
    // prettier-ignore
    const customerNames = ["Amy", "Ryker", "Jazmin", "Martin", "Elaine", "Wallace",
      "Luella", "Nash", "Gia", "Marcelo", "Elsie", "Korbyn", "Aliza", "Blair",
      "Selene", "River", "Carmen", "Tyler"]

    const numberCustomers =
      parseInt(process.env.NUMBER_CUSTOMERS!) || customerNames.length;

    customerInserts = customerNames
      .slice(0, numberCustomers)
      .map((name) =>
        client.query(`INSERT INTO customers (name) VALUES ('${name}')`)
      );
    console.log("populating customers table");
  }

  // reset drivers, if requested
  if (process.env.RESET_DRIVERS == "true") {
    console.log("resetting drivers");
    await client.query("DELETE FROM drivers");
  }

  // populate drivers table, if still empty
  const driverCount = (await client.query("SELECT COUNT(*) FROM drivers"))
    .rows[0].count;
  if (driverCount == 0) {
    // prettier-ignore
    const driverNames = ["Daphne", "Colin", "Clare", "Trevor", "Aliana", "Romeo",
      "Meredith", "Bjorn", "Elle", "Lewis", "Evie", "Harvey", "Aylin", "Brendan"];

    const numberDrivers =
      parseInt(process.env.NUMBER_DRIVERS!) || driverNames.length;

    driverInserts = driverNames
      .slice(0, numberDrivers)
      .map((name) =>
        client.query(`INSERT INTO drivers (name) VALUES ('${name}')`)
      );
    console.log("populating drivers table");
  }

  await Promise.all([customerInserts, driverInserts].flat());
}
