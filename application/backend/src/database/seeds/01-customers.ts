import { Knex } from "knex";
import { faker } from "@faker-js/faker";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("customers").del();

  const count = parseInt(process.env.NUMBER_CUSTOMERS!) || 18;

  const customers = Array.from({ length: count }).map(() => ({
    name: faker.person.firstName(),
  }));

  await knex("customers").insert(customers);
}
