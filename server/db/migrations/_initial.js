
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
    table.uuid('companyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Appointment', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    // <custom>
    table.uuid('workOrderId').notNullable()
    table.uuid('techId')
    table.date('date')
    table.string('status')
    table.jsonb('row').index()
    table.unique(['workOrderId', 'techId', 'date'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
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
    table.uuid('companyId') // one way
    table.string('name')
    table.json('reports')
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
    table.uuid('companyId')
    table.uuid('subcontractorId').index()
    table.uuid('startLocationId')
    table.uuid('dataSourceId')
    table.unique(['companyId', 'externalId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('WorkGroup', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.uuid('scopeCompanyId')
    table.uuid('companyId')
    table.integer('order').notNullable()
    table.string('type').notNullable() // 'Company', 'Office', 'Team', 'DMA', 'Service Region', 'Division'
    table.string('externalId').notNullable()
    table.string('name').notNullable()
    table.unique(['scopeCompanyId', 'companyId', 'type', 'externalId'])
    table.uuid('geographyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('WorkOrder', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    // <custom>
    table.string('externalId').unique()
    table.date('date')
    table.string('type')
    table.string('status')
    table.uuid('companyId')
    table.uuid('subcontractorId').index()
    table.json('row')
    table.unique(['companyId', 'externalId'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  })
  .alterTable('Account', table => {
    table.foreign('companyId').references('Company.id')
  })
  .alterTable('Appointment', table => {
    table.foreign('workOrderId').references('WorkOrder.id')
    table.foreign('techId').references('Tech.id')
  })
  .alterTable('DataImport', table => {
    table.foreign('dataSourceId').references('DataSource.id')
  })
  .alterTable('Session', table => {
    table.foreign('accountId').references('Account.id')
  })
  .alterTable('Tech', table => {
    table.foreign('companyId').references('Company.id')
    table.foreign('subcontractorId').references('Company.id')
    table.foreign('startLocationId').references('Geography.id')
    table.foreign('dataSourceId').references('DataSource.id')
  })
  .alterTable('WorkGroup', table => {
    table.foreign('geographyId').references('Geography.id')
    table.foreign('companyId').references('Company.id')
    table.foreign('scopeCompanyId').references('Company.id')
  })
  .createTable('companyDataSources', table => { 
      table.uuid('dataSourceId').notNullable()
      table.uuid('companyId').notNullable()
      table.primary(['dataSourceId', 'companyId'])
      table.unique(['companyId', 'dataSourceId'])
      table.foreign('dataSourceId').references('DataSource.id')
      table.foreign('companyId').references('Company.id')
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
