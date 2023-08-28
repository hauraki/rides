import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("customers", function (t) {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name").notNullable();
    t.boolean("active");
    t.specificType("location", "POINT");
    t.specificType("destination", "POINT");
    t.uuid("driver_id").unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("customers");
}
