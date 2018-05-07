export function up(knex) {
  return knex.schema
  .alterTable('SdcrDataPoint', table => {
    table.dropColumn('workGroupId')
  })
  .createTable('sdcrDataPointWorkGroups', table => {
    table.uuid('sdcrDataPointId').notNullable()
    table.uuid('workGroupId').notNullable()
    table.primary(['sdcrDataPointId', 'workGroupId'])
    table.unique(['workGroupId', 'sdcrDataPointId'])
    table.foreign('sdcrDataPointId').references('SdcrDataPoint.id')
    table.foreign('workGroupId').references('WorkGroup.id')
  })
}

export function down(knex) {
  return knex.schema.dropTable('sdcrDataPointWorkGroups').then(() => {
    return knex.schema.alterTable('SdcrDataPoint', table => {
      table.uuid('workGroupId').notNullable()
      table.foreign('workGroupId').references('WorkGroup.id')
    })
  })
}
