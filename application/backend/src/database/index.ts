import * as knexPkg from "knex";
const { knex } = knexPkg.default;
import pg from "pg";

// stop pg from parsing POINTs
pg.types.setTypeParser(600, (str: any) => str);

import configs from "./knexfile.js";

interface Driver {
  id: string;
  name: string;
  status: string;
  location: string;
  path: string;
  path_index: number;
  path_length: number;
  path_digest: string;
  customer_id: string;
  customer_name: string;
}

interface Customer {
  id: string;
  name: string;
  active: boolean;
  location: string;
  destination: string;
  driver_id: string;
}

const db = knex(configs[process.env.NODE_ENV || "development"]);

export async function getDrivers() {
  return db<Driver>("drivers").select("*");
}

export async function getCustomers() {
  return db<Customer>("customers").select("*").where({ active: true });
}
