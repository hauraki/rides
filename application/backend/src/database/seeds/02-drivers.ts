import { Knex } from "knex";
import { faker } from "@faker-js/faker";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("drivers").del();

  const count = parseInt(process.env.NUMBER_DRIVERS!) || 15;

  const drivers = Array.from({ length: count }).map(() => ({
    name: faker.person.firstName(),
  }));

  await knex("drivers").insert(drivers);
}
