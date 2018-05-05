export function up(knex) {
  return knex.schema
  .alterTable('Account', table => {
    table.index('companyId')
  })
  .alterTable('Appointment', table => {
    table.index('workOrderId')
    table.index('techId')
  })
  .alterTable('Company', table => {
    table.index('workGroupId')
  })
  .alterTable('DataImport', table => {
    table.index('dataSourceId')
  })
  .alterTable('DataSource', table => {
    table.index('companyId')
  })
  .alterTable('SdcrDataPoint', table => {
    table.index('workGroupId')
    table.index('workOrderId')
    table.index('techId')
  })
  .alterTable('Session', table => {
    table.index('rootAccountId')
    table.index('accountId')
  })
  .alterTable('Tech', table => {
    table.index('companyId')
    table.index('startLocationId')
    table.index('dataSourceId')
  })
  .alterTable('WorkGroup', table => {
    table.index('companyId')
  })
  .alterTable('WorkOrder', table => {
    table.index('companyId')
  })
}

export function down() {
  return Promise.resolve()
}
