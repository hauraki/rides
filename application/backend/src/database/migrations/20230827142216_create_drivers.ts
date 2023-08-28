import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("drivers", function (t) {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name").notNullable();
    t.enum("status", ["off", "idle", "pickup", "enroute"], {
      useNative: true,
      enumName: "status_enum",
    })
      .defaultTo("off")
      .notNullable();
    t.specificType("location", "POINT");
    t.specificType("path", "PATH");
    t.integer("path_index");
    t.integer("path_length");
    t.string("path_digest");
    t.string("customer_name");
    t.uuid("customer_id").unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("drivers").raw("DROP TYPE status_enum");
}
