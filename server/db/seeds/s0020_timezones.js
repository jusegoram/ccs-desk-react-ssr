import fs from 'fs'
import csv from 'csv'
import path from 'path'
import Promise from 'bluebird'

Promise.promisifyAll(csv)

exports.seed = async function(knex) {
  const tableExists = await knex.schema.hasTable('timezones')
  if (!tableExists) {
    console.log('Creating timezone table (this might take a minute)...') //eslint-disable-line no-console
    await knex.schema.createTable('timezones', table => {
      table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .notNullable()
      table.string('name').notNullable()
      table.specificType('polygon', 'geography(MULTIPOLYGON, 4326)').notNullable()
    })
    await knex.schema.raw('CREATE INDEX timezones_polygon_index ON timezones USING GIST (polygon);')

    const csvString = fs.readFileSync(path.resolve(__dirname, '../seedData/timezones.csv')) + ''
    const records = await csv.parseAsync(csvString, {
      columns: true,
      trim: true,
      skip_empty_lines: true,
      max_limit_on_data_read: 10000000,
    })

    await Promise.map(
      records,
      async record => {
        await knex('timezones').insert({
          name: record.name,
          polygon: knex.raw("ST_GeomFromEWKB(decode(?, 'hex'))::geography", record.polygon),
        })
      },
      { concurrency: 10 }
    )
  }
}
