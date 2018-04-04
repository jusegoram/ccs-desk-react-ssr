
export function up(knex) {
  return knex.schema
  .createTable('Account', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.specificType('order', 'SERIAL')
    // <custom>
    table.string('name').notNullable()
    table.string('email').notNullable().unique()
    table.string('password').notNullable()
    table.boolean('root').defaultTo(false).notNullable()
    table.uuid('employeeId')
    table.uuid('companyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Company', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('name').unique()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('DataImport', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('dataSourceId')
    table.string('status').defaultTo('pending')
    table.text('error')
    table.timestamp('downloadedAt')
    table.timestamp('completedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('DataSource', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('service')
    table.string('name')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.unique(['service', 'name'])
  })
  .createTable('Employee', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.uuid('companyId').notNullable()
    table.uuid('workGroupId')
    table.uuid('startLocationId')
    table.string('externalId').notNullable()
    table.string('timezone')
    table.string('role').defaultTo('Tech').notNullable() // 'Tech', 'Manager'
    table.string('name')
    table.string('phoneNumber')
    table.string('email')
    table.uuid('dataSourceId')
    table.unique(['companyId', 'externalId'])
    table.unique(['externalId', 'companyId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('FeatureSet', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.uuid('companyId').notNullable()
    table.boolean('hasAddressBook').defaultTo(false).notNullable()
    table.boolean('hasTimecards').defaultTo(false).notNullable()
    table.boolean('hasVehicleClaims').defaultTo(false).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Geography', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('type').notNullable()
    table.string('externalId')
    table.string('name')
    table.string('streetAddress')
    table.string('zipcode')
    table.string('city')
    table.string('state')
    table.string('country')
    table.text('polygonKml')
    table.specificType('polygon', 'geography(MULTIPOLYGON, 4326)')
    table.float('radius')
    table.decimal('latitude', 10, 7)
    table.decimal('longitude', 10, 7)
    table.specificType('point', 'geography(POINT, 4326)')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.index(['type', 'externalId'])
    table.index(['type', 'polygon'])
    table.index(['type', 'point'])
  })
  .createTable('Invite', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.string('role').notNullable()
    table.string('status').notNullable().defaultTo('Unsent')
    table.uuid('token').defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('senderId').notNullable()
    table.uuid('recipientId').notNullable()
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Permission', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.uuid('accountId')
    table.string('type').defaultTo('read').notNullable()
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Question', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.integer('order').defaultTo(0).notNullable()
    table.text('text').notNullable()
    table.text('answer')
    table.string('answerType').notNullable()
    table.string('section').notNullable()
  })
  .createTable('Report', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt')
    table.uuid('companyId').notNullable()
    table.uuid('creatorId')
    table.string('name').notNullable()
    table.uuid('templateId').index()
    table.timestamp('completedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Session', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.timestamp('expiresAt').defaultTo(knex.fn.now())
    table.uuid('rootAccountId')
    table.uuid('accountId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Timecard', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.uuid('employeeId')
    table.date('date').notNullable()
    table.timestamp('clockedInAt')
    table.timestamp('clockedOutAt')
    table.uuid('clockInLocationId')
    table.uuid('clockOutLocationId')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Vehicle', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('companyId').notNullable()
    table.string('externalId').notNullable()
    table.unique(['companyId', 'externalId'])
    table.unique(['externalId', 'companyId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('VehicleClaim', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.date('date').notNullable()
    table.uuid('employeeId')
    table.uuid('vehicleId')
    table.uuid('claimLocationId')
    table.uuid('returnLocationId')
    table.uuid('claimReportId')
    table.uuid('returnReportId')
    table.timestamp('claimedAt')
    table.timestamp('returnedAt')
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('WorkGroup', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.uuid('companyId')
    table.integer('order').notNullable()
    table.string('type').notNullable() // 'Company', 'Office', 'Team', 'DMA', 'Service Region', 'Division'
    table.string('externalId').notNullable()
    table.string('name').notNullable()
    table.unique(['companyId', 'type', 'externalId'])
    table.uuid('geographyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('WorkSchedule', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('employeeId').notNullable()
    table.string('day').notNullable()
    table.time('start').notNullable()
    table.time('end').notNullable()
    table.unique(['employeeId', 'day'])
    table.index(['start', 'end'])
  })
  .alterTable('Account', table => {
    table.foreign('employeeId').references('Employee.id')
    table.foreign('companyId').references('Company.id')
  })
  .alterTable('DataImport', table => {
    table.foreign('dataSourceId').references('DataSource.id')
  })
  .alterTable('Employee', table => {
    table.foreign('companyId').references('Company.id')
    table.foreign('workGroupId').references('WorkGroup.id')
    table.foreign('startLocationId').references('Geography.id')
  })
  .alterTable('FeatureSet', table => {
    table.foreign('companyId').references('Company.id')
  })
  .alterTable('Invite', table => {
    table.foreign('senderId').references('Account.id')
    table.foreign('recipientId').references('Account.id')
  })
  .alterTable('Report', table => {
    table.foreign('creatorId').references('Account.id')
    table.foreign('companyId').references('Company.id')
    table.foreign('templateId').references('Report.id')
  })
  .alterTable('Session', table => {
    table.foreign('accountId').references('Account.id')
  })
  .alterTable('Timecard', table => {
    table.foreign('employeeId').references('Employee.id')
    table.foreign('clockInLocationId').references('Geography.id')
    table.foreign('clockOutLocationId').references('Geography.id')
  })
  .alterTable('Vehicle', table => {
    table.foreign('companyId').references('Company.id')
  })
  .alterTable('VehicleClaim', table => {
    table.foreign('employeeId').references('Employee.id')
    table.foreign('vehicleId').references('Vehicle.id')
    table.foreign('claimReportId').references('Report.id')
    table.foreign('returnReportId').references('Report.id')
    table.foreign('claimLocationId').references('Geography.id')
    table.foreign('returnLocationId').references('Geography.id')
  })
  .alterTable('WorkGroup', table => {
    table.foreign('geographyId').references('Geography.id')
    table.foreign('companyId').references('Company.id')
  })
  .alterTable('WorkSchedule', table => {
    table.foreign('employeeId').references('Employee.id')
  })
  .createTable('permissionWorkGroups', table => { 
      table.uuid('permissionId').notNullable()
      table.uuid('workGroupId').notNullable()
      table.primary(['permissionId', 'workGroupId'])
      table.unique(['workGroupId', 'permissionId'])
      table.foreign('permissionId').references('Permission.id')
      table.foreign('workGroupId').references('WorkGroup.id')
  })
  .createTable('reportQuestions', table => { 
      table.uuid('reportId').notNullable()
      table.uuid('questionId').notNullable()
      table.primary(['reportId', 'questionId'])
      table.unique('questionId')
      table.foreign('reportId').references('Report.id')
      table.foreign('questionId').references('Question.id')
  })
  .createTable('vehicleReports', table => { 
      table.uuid('vehicleId').notNullable()
      table.uuid('reportId').notNullable()
      table.primary(['vehicleId', 'reportId'])
      table.unique('reportId')
      table.foreign('vehicleId').references('Vehicle.id')
      table.foreign('reportId').references('Report.id')
  })
  .createTable('workGroupTechs', table => { 
      table.uuid('workGroupId').notNullable()
      table.uuid('techId').notNullable()
      table.primary(['workGroupId', 'techId'])
      table.unique(['techId', 'workGroupId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('techId').references('Employee.id')
  })
  .createTable('workGroupManagers', table => { 
      table.uuid('workGroupId').notNullable()
      table.uuid('managerId').notNullable()
      table.primary(['workGroupId', 'managerId'])
      table.unique(['managerId', 'workGroupId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('managerId').references('Employee.id')
  })
  .createTable('directv_sr_data', table => { 
      table.string('Service Region').index()
      table.string('Office')
      table.string('DMA')
      table.string('Division')
      table.string('HSP')
  })
}

export function down(knex) {
  return knex.raw(`
    DO $$ DECLARE
        r RECORD;
    BEGIN
        -- if the schema you operate on is not "current", you will want to
        -- replace current_schema() in query with 'schematodeletetablesfrom'
        -- *and* update the generate 'DROP...' accordingly.
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' and tablename not in ('knex_migrations', 'knex_migrations_lock')) LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END $$;
  `)
}
