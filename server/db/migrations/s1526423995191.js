export function up(knex) {
  return knex.schema
  .dropTable('workGroupAppointments')
  .dropTable('Appointment')
  .dropTable('workGroupWorkOrders')
  .dropTable('sdcrDataPointWorkGroups')
  .dropTable('SdcrDataPoint')
  .dropTable('WorkOrder')
  .createTable('Appointment', table => {
    table
    .uuid('id')
    .primary()
    .defaultTo(knex.raw('uuid_generate_v4()'))
    table.specificType('lifespan', 'tstzrange').notNullable()
    table.string('externalId')
    table.date('dueDate').index()
    table.string('type')
    table.string('status').index()
    table.jsonb('row').index()
    table
    .timestamp('createdAt')
    .defaultTo(knex.fn.now())
    .notNullable()
    table.timestamp('destroyedAt')
    table.uuid('techId').index()
    table.foreign('techId').references('Tech.id')
  })
  .createTable('workGroupAppointments', table => {
    table.uuid('appointmentId').notNullable()
    table.uuid('workGroupId').notNullable()
    table.primary(['appointmentId', 'workGroupId'])
    table.unique(['workGroupId', 'appointmentId'])
    table.foreign('workGroupId').references('WorkGroup.id')
    table.foreign('appointmentId').references('Appointment.id')
  })
  .createTable('SdcrDataPoint', table => {
    table
    .uuid('id')
    .primary()
    .defaultTo(knex.raw('uuid_generate_v4()'))
    table.date('date').notNullable()
    table.integer('value').notNullable()
    table.string('type').notNullable()
    table.string('dwellingType').notNullable()
    table.string('externalId')
    table.json('row')
    table.index(['date', 'externalId'])
    table.uuid('appointmentId').index()
    table
    .uuid('techId')
    .notNullable()
    .index()
    table.foreign('appointmentId').references('Appointment.id')
    table.foreign('techId').references('Tech.id')
  })
  .createTable('sdcrDataPointWorkGroups', table => {
    table.uuid('sdcrDataPointId').notNullable()
    table.uuid('workGroupId').notNullable()
    table.primary(['sdcrDataPointId', 'workGroupId'])
    table.unique(['workGroupId', 'sdcrDataPointId'])
    table
    .foreign('sdcrDataPointId')
    .references('SdcrDataPoint.id')
    .onDelete('CASCADE')
    table.foreign('workGroupId').references('WorkGroup.id')
  })
}

export function down(knex, Promise) {
  return Promise.resolve()
}
