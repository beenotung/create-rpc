import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (!(await knex.schema.hasTable('user'))) {
    await knex.schema.createTable('user', table => {
      table.increments('id')
      table.text('username').notNullable().unique()
      table.text('password_hash').notNullable()
      table.boolean('is_admin').notNullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('log'))) {
    await knex.schema.createTable('log', table => {
      table.increments('id')
      table.integer('user_id').unsigned().nullable().references('user.id')
      table.text('method').notNullable()
      table.text('url').notNullable()
      table.json('input').notNullable()
      table.json('output').notNullable()
      table.integer('time_used').notNullable()
      table.text('user_agent').nullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('file'))) {
    await knex.schema.createTable('file', table => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('user.id')
      table.text('filename').notNullable()
      table.integer('size').notNullable()
      table.text('mimetype').notNullable()
      table.text('original_filename').nullable()
      table.timestamps(false, true)
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('file')
  await knex.schema.dropTableIfExists('log')
  await knex.schema.dropTableIfExists('user')
}
