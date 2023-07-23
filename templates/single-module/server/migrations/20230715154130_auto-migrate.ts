import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (!(await knex.schema.hasTable('file'))) {
    await knex.schema.createTable('file', table => {
      table.increments('id')
      table.text('filename').notNullable()
      table.integer('size').notNullable()
      table.text('mimetype').notNullable()
      table.timestamps(false, true)
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('file')
}
