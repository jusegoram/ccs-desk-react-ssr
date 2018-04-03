import fs from 'fs'
import csv from 'csv'
import path from 'path'
import Promise from 'bluebird'

Promise.promisifyAll(csv)

exports.seed = async function(knex) {
  const csvString = fs.readFileSync(path.resolve(__dirname, '../seedData/sr_lookup.csv')) + ''
  const records = await csv.parseAsync(csvString, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
  })

  return knex.batchInsert('directv_sr_data', records)
}
