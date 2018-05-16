// Update with your config settings.
const localConfig = {
  client: 'postgresql',
  connection: {
    host: 'localhost',
    password: process.env.DB_PASSWORD_DEVELOPMENT,
    database: 'ccs',
    multipleStatements: true,
    charset: 'utf8',
  },
  pool: {
    min: 4,
    max: 1024,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './server/db/migrations',
  },
  seeds: {
    directory: './server/db/seeds',
  },
}
module.exports = {
  development: localConfig,
  test: localConfig,
  production: {
    client: 'postgresql',
    connection: {
      host: 'ccs2.cljr4tpdvim0.us-east-1.rds.amazonaws.com',
      user: 'master',
      password: process.env.DB_PASSWORD_PRODUCTION,
      database: 'ccs',
      multipleStatements: true,
      charset: 'utf8',
    },
    pool: {
      min: 4,
      max: 1024,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './server/db/migrations',
    },
    seeds: {
      directory: './server/db/seeds',
    },
  },
  legacy: {
    client: 'postgresql',
    connection: {
      host: 'ccsdesk.cljr4tpdvim0.us-east-1.rds.amazonaws.com',
      user: 'master',
      password: process.env.LEGACY_DB_PASSWORD,
      database: 'ccsdesk',
      multipleStatements: true,
      charset: 'utf8',
    },
    pool: {
      min: 4,
      max: 1024,
    },
  },
}
