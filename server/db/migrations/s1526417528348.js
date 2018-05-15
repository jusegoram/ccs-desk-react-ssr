export function up(knex) {
  return knex.schema.createTable('workGroupAppointments', table => {
    table.uuid('appointmentId').notNullable()
    table.uuid('workGroupId').notNullable()
    table.primary(['appointmentId', 'workGroupId'])
    table.unique(['workGroupId', 'appointmentId'])
    table.foreign('workGroupId').references('WorkGroup.id')
    table.foreign('appointmentId').references('Appointment.id')
  })
}

export function down(knex) {
  return knex.schema.dropTable('workGroupAppointments')
}
