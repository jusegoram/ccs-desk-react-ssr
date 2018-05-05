export function up(knex) {
  return knex.schema.createTable('SdcrDataPoint', table => {
    table
    .uuid('id')
    .primary()
    .defaultTo(knex.raw('uuid_generate_v4()'))
    table.date('date').notNullable()
    table.integer('value').notNullable()
    table.uuid('workGroupId').notNullable()
    table.uuid('workOrderId').notNullable()
    table.uuid('techId').notNullable()
    table.foreign('workGroupId').references('WorkGroup.id')
    table.foreign('workOrderId').references('WorkOrder.id')
    table.foreign('techId').references('Tech.id')
  })
}

export function down(knex) {
  return knex.schema.dropTable('SdcrDataPoint')
}
