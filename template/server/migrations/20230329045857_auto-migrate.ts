import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('log'))) {
    await knex.schema.createTable('log', table => {
      table.increments('id')
      table.integer('user_id').unsigned().nullable().references('user.id')
      table.text('rpc').notNullable()
      table.json('input').notNullable()
      table.json('output').notNullable()
      table.integer('time_used').notNullable()
      table.timestamps(false, true)
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('log')
}
