export function up(knex) {
  return knex.schema.renameTable('sdcrDataPointWorkGroups', 'workGroupSdcrDataPoints')
}

export function down(knex, Promise) {
  return Promise.resolve()
}
