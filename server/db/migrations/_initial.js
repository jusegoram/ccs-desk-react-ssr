
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
    table.uuid('companyId').index()
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Appointment', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.specificType('lifespan', 'tstzrange').notNullable()
    table.string('externalId')
    table.date('dueDate').index()
    table.string('type')
    table.string('status').index()
    table.jsonb('row').index()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('destroyedAt')
    table.uuid('workOrderId').notNullable().index()
    table.uuid('techId').index()
  })
  .createTable('Company', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('name').unique()
    table.uuid('workGroupId').index()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('DataImport', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('dataSourceId').index()
    table.string('reportName')
    table.string('status').defaultTo('Pending')
    table.text('error')
    table.timestamp('downloadedAt')
    table.timestamp('completedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('DataSource', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('companyId').index() // one way
    table.string('name')
    table.unique(['companyId', 'name'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Geography', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('timezone')
    table.string('streetAddress')
    table.string('zipcode')
    table.string('city')
    table.string('state')
    table.string('country')
    table.text('polygonKml')
    table.float('radius')
    table.decimal('latitude', 10, 7)
    table.decimal('longitude', 10, 7)
    table.specificType('polygon', 'geography(MULTIPOLYGON, 4326)').index()
    table.specificType('point', 'geography(POINT, 4326)').index()
    table.index(['latitude', 'longitude'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Invite', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('email').notNullable()
    table.string('name').notNullable().defaultTo('Unsent')
    table.string('status').notNullable().defaultTo('Unsent')
    table.string('role').notNullable().defaultTo('Supervisor')
    table.uuid('token').defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('senderId').notNullable().index()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('SdcrDataPoint', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.date('date').notNullable()
    table.integer('value').notNullable()
    table.string('type').notNullable()
    table.string('dwellingType').notNullable()
    table.string('workOrderExternalId')
    table.json('row')
    table.index(['date', 'workOrderExternalId'])
    table.uuid('appointmentId').index()
    table.uuid('techId').notNullable().index()
  })
  .createTable('Session', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.timestamp('expiresAt').defaultTo(knex.fn.now())
    table.uuid('rootAccountId').index()
    table.uuid('accountId').index()
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Tech', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.string('externalId').notNullable()
    table.string('alternateExternalId').index()
    table.string('timezone')
    table.string('name')
    table.string('phoneNumber')
    table.string('email')
    table.string('skills')
    table.string('schedule')
    table.json('row')
    table.uuid('companyId').index()
    table.uuid('startLocationId').index()
    table.uuid('dataSourceId').index()
    table.unique(['companyId', 'externalId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('WorkGroup', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.uuid('companyId').index()
    table.integer('order').notNullable()
    table.string('type').notNullable() // 'Company', 'Office', 'Team', 'DMA', 'Service Region', 'Division'
    table.string('externalId').notNullable()
    table.string('name').notNullable()
    table.unique(['companyId', 'type', 'externalId'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .alterTable('Account', table => {
    table.foreign('companyId').references('Company.id')
  })
  .alterTable('Appointment', table => {
    table.foreign('workOrderId').references('WorkOrder.id')
    table.foreign('techId').references('Tech.id')
  })
  .alterTable('Company', table => {
    table.foreign('workGroupId').references('WorkGroup.id')
  })
  .alterTable('DataImport', table => {
    table.foreign('dataSourceId').references('DataSource.id')
  })
  .alterTable('DataSource', table => {
    table.foreign('companyId').references('Company.id')
  })
  .alterTable('Invite', table => {
    table.foreign('senderId').references('Account.id')
  })
  .alterTable('SdcrDataPoint', table => {
    table.foreign('appointmentId').references('Appointment.id')
    table.foreign('techId').references('Tech.id')
  })
  .alterTable('Session', table => {
    table.foreign('accountId').references('Account.id')
  })
  .alterTable('Tech', table => {
    table.foreign('companyId').references('Company.id')
    table.foreign('startLocationId').references('Geography.id')
    table.foreign('dataSourceId').references('DataSource.id')
  })
  .alterTable('WorkGroup', table => {
    table.foreign('companyId').references('Company.id')
  })
  .createTable('workGroupAppointments', table => { 
      table.uuid('appointmentId').notNullable()
      table.uuid('workGroupId').notNullable()
      table.primary(['appointmentId', 'workGroupId'])
      table.unique(['workGroupId', 'appointmentId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('appointmentId').references('Appointment.id')
  })
  .createTable('companyDataSources', table => { 
      table.uuid('dataSourceId').notNullable()
      table.uuid('companyId').notNullable()
      table.primary(['dataSourceId', 'companyId'])
      table.unique(['companyId', 'dataSourceId'])
      table.foreign('dataSourceId').references('DataSource.id')
      table.foreign('companyId').references('Company.id')
  })
  .createTable('sdcrDataPointWorkGroups', table => { 
      table.uuid('sdcrDataPointId').notNullable()
      table.uuid('workGroupId').notNullable()
      table.primary(['sdcrDataPointId', 'workGroupId'])
      table.unique(['workGroupId', 'sdcrDataPointId'])
      table.foreign('sdcrDataPointId').references('SdcrDataPoint.id').onDelete('CASCADE')
      table.foreign('workGroupId').references('WorkGroup.id')
  })
  .createTable('workGroupTechs', table => { 
      table.uuid('workGroupId').notNullable()
      table.uuid('techId').notNullable()
      table.unique(['workGroupId', 'techId'])
      table.primary(['techId', 'workGroupId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('techId').references('Tech.id')
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
