import { Knex } from "knex";
const commonConfig: Knex.Config = {
  client: "pg",
  connection: process.env.POSTGRES_URL,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};

const config: { [key: string]: Knex.Config } = {
  development: commonConfig,
  production: commonConfig,
};

export default config;
