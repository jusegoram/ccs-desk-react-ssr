
export function up(knex) {
  return knex.schema
  .createTable('Account', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.string('name').notNullable()
    table.string('email').notNullable()
    table.string('password').notNullable()
    table.boolean('root').defaultTo(false).notNullable()
    table.uuid('employeeId')
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
  .createTable('Employee', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.uuid('companyId').notNullable()
    table.string('externalId').notNullable()
    table.string('name')
    table.string('phoneNumber')
    table.string('email')
    table.uuid('dataSourceId')
    table.uuid('currentTimecardId')
    table.unique(['companyId', 'externalId'])
    table.unique(['externalId', 'companyId'])
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
    table.specificType('polygon', 'geography(MULTIPOLYGON, 4326)').index()
    table.float('radius')
    table.decimal('latitude', 10, 7)
    table.decimal('longitude', 10, 7)
    table.specificType('point', 'geography(POINT, 4326)').index()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.index(['type', 'externalId'])
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
  .createTable('Report', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt')
    table.uuid('companyId').notNullable()
    table.uuid('creatorId')
    table.uuid('vehicleId')
    table.string('name').notNullable()
    table.boolean('isTemplate').defaultTo(false).notNullable()
    table.timestamp('completedAt')
    table.index(['isTemplate', 'name'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('ReportQuestion', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('reportId').notNullable()
    table.integer('order').defaultTo(0).notNullable()
    table.text('questionText').notNullable()
    table.string('answerType').notNullable()
    table.text('answerText')
    table.text('answerImageUri')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Session', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.timestamp('expiresAt').defaultTo(knex.fn.now())
    table.uuid('accountId')
    table.string('token')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  .createTable('Timecard', table => {
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.timestamp('clockedInAt').notNullable()
    table.timestamp('clockedOutAt').notNullable()
    table.uuid('employeeId').notNullable()
    table.uuid('vehicleId')
    table.uuid('clockedInReportId')
    table.uuid('clockedOutReportId')
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
  .alterTable('Account', table => {
    table.foreign('employeeId').references('Employee.id')
  })
  .alterTable('Employee', table => {
    table.foreign('companyId').references('Company.id')
    table.foreign('currentTimecardId').references('Timecard.id')
  })
  .alterTable('Invite', table => {
    table.foreign('senderId').references('Account.id')
    table.foreign('recipientId').references('Account.id')
  })
  .alterTable('Report', table => {
    table.foreign('creatorId').references('Account.id')
    table.foreign('companyId').references('Company.id')
    table.foreign('vehicleId').references('Vehicle.id')
  })
  .alterTable('ReportQuestion', table => {
    table.foreign('reportId').references('Report.id')
  })
  .alterTable('Session', table => {
    table.foreign('accountId').references('Account.id')
  })
  .alterTable('Timecard', table => {
    table.foreign('employeeId').references('Employee.id')
    table.foreign('vehicleId').references('Vehicle.id')
    table.foreign('clockedInReportId').references('Report.id')
    table.foreign('clockedOutReportId').references('Report.id')
  })
  .alterTable('Vehicle', table => {
    table.foreign('companyId').references('Company.id')
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
