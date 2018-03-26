import * as models from 'server/api/models'
import getUpCode from 'server/db/scripts/generateMigration/getUpCode'
import fs from 'fs'
import path from 'path'

const upCode = getUpCode(models)

const migration = `
${upCode}

export function down(knex) {
  return knex.raw(\`
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
  \`)
}
`

console.log('writing migration:')
console.log(upCode)

const migrationsPath = path.resolve(__dirname, '../../migrations')
const existingMigration = fs.readdirSync(migrationsPath)[0]
if (existingMigration) {
  fs.unlinkSync(path.resolve(migrationsPath, existingMigration))
}
const migrationFilePath = path.resolve(migrationsPath, '_initial.js')
fs.writeFileSync(migrationFilePath, migration)
