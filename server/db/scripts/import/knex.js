import Knex from 'knex'

export default Knex({
  client: 'postgresql',
  connection: {
    host: 'ccsdesk.cljr4tpdvim0.us-east-1.rds.amazonaws.com',
    user: 'raz',
    password: process.env.LEGACY_DB_PASSWORD,
    database: 'ccsdesk',
    multipleStatements: true,
    charset: 'utf8',
  },
  pool: {
    min: 4,
    max: 1024,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
})
