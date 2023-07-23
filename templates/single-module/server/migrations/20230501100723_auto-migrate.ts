import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `log` add column `user_agent` text null')
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `log` drop column `user_agent`')
}
