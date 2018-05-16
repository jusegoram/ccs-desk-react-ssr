export function up(knex) {
  return knex.schema
  .alterTable('Appointment', table => {
    table.dropColumn('workOrderId')
  })
  .alterTable('Appointment', table => {
    table
    .uuid('workOrderId')
    .defaultTo(knex.raw('uuid_generate_v4()'))
    .index()
  })
}

export function down(knex, Promise) {
  return Promise.resolve()
}
