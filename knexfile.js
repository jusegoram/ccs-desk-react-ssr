// Update with your config settings.
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
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
  production: {
    client: 'postgresql',
    connection: {
      host: '',
      user: 'master',
      password: process.env.PRODUCTION_PASSWORD,
      database: 'fleet',
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
}
