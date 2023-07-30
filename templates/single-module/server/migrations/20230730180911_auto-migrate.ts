import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `file` add column `user_id` integer not null references `user`(`id`)')
  await knex.raw('alter table `file` add column `original_filename` text null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `file` drop column `original_filename`')
  await knex.raw('alter table `file` drop column `user_id`')
}
