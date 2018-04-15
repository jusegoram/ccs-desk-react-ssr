import { Model } from 'objection'

exports.seed = function(knex) {
  Model.knex(knex)

  return knex
  .raw(DROP_ALL_TABLES_QUERY)
  .then(() => knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
  .then(() => knex.raw('CREATE EXTENSION IF NOT EXISTS postgis'))
  .then(async () => (await knex.schema.hasTable('knex_migrations')) && knex('knex_migrations').delete())
  .then(() => knex.migrate.latest())
}

const keepTables = [
  'knex_migrations',
  'knex_migrations_lock',
  'topology.layer',
  'topology.topology',
  'spatial_ref_sys',
  'timezones',
]

// keepTables.push(...['Company', 'Office', 'Team', 'Tech'])

const DROP_ALL_TABLES_QUERY = `
DO $$ DECLARE
    r RECORD;
BEGIN
    -- if the schema you operate on is not "current", you will want to
    -- replace current_schema() in query with 'schematodeletetablesfrom'
    -- *and* update the generate 'DROP...' accordingly.
    FOR r IN (
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename NOT IN ('${keepTables.join("','")}')
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
`
