export function up(knex) {
  return knex.schema
  .createTable('WorkOrder', table => {
    table
    .uuid('id')
    .primary()
    .defaultTo(knex.raw('uuid_generate_v4()'))
    // <custom>
    table.string('externalId').unique()
    table.uuid('currentAppointmentId')
    table.foreign('currentAppointmentId').references('Appointment.id')
  })
  .alterTable('Appointment', table => {
    table.uuid('workOrderId')
    table.foreign('workOrderId').references('WorkOrder.id')
  })
}

export function down(knex, Promise) {
  return Promise.resolve()
}
