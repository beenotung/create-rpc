import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (!(await knex.schema.hasTable('tag'))) {
    await knex.schema.createTable('tag', table => {
      table.increments('id')
      table.text('name').notNullable().unique()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('user_tag'))) {
    await knex.schema.createTable('user_tag', table => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('user.id')
      table.integer('tag_id').unsigned().notNullable().references('tag.id')
      table.timestamps(false, true)
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_tag')
  await knex.schema.dropTableIfExists('tag')
}
