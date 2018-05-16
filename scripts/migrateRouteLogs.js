import Knex from 'knex'
import _ from 'lodash'
import { transaction, Model } from 'objection'
import * as rawModels from 'server/api/models'
import sanitizeName from 'server/util/sanitizeName'
import Timer from 'server/util/Timer'
import handleStandardRows from 'server/cli/commands/import/processors/routelog/handleStandardRows'
import sanitizeCompanyName from 'server/cli/commands/import/processors/sanitizeCompanyName'
import moment from 'moment-timezone'
import Eta from './ETA'

import knexfile from '../knexfile'

const legacyKnex = Knex(knexfile['legacy'])
const knex = Knex(knexfile['production'])
moment.tz.setDefault('America/Chicago')

const outputEtaInfo = eta => {
  const info = eta.info
  console.log(`Import ${(100 * info.percentComplete).toFixed(1)}% Complete:
  Current time: ${moment().format('ll LTS')}
  Reports completed: ${eta.opsCompleted}
  Reports remaining: ${info.opsRemaining}
  Time taken so far: ${moment.duration(info.elapsed).humanize()} (${info.elapsed}ms)
  Time taken per report: ${moment.duration(info.rate).humanize()} (${info.rate}ms)
  ETA for next report: ${moment(eta.info.nextOpEta).format('ll LTS')}
  Estimated total time: ${moment.duration(info.total).humanize()} (${info.total}ms)
  Estimated time remaining: ${moment.duration(info.timeRemaining).humanize()} (${info.timeRemaining}ms)
  Overall ETA: ${moment(info.eta).format('ll LTS')}
`)
}

Model.knex(knex)

const run = async () => {
  // .where('started_at', '<=', '2018-05-03T17:00:00-500')
  const routelogs = legacyKnex('downloaded_csvs')
  .where('started_at', '>=', '2018-05-01T04:00:00-500')
  .whereNot('imported', true)
  .where({ saturate_status: 'Complete' })
  .where({ report_name: 'Routelog' })
  .orderBy('started_at')
  .limit(3)
  const routelogIds = routelogs.clone().select('cid')

  // const numRows = await legacyKnex('downloaded_csv_rows')
  // .count('id', 'rows')
  // .whereIn('csv_cid', routelogIds)
  // .first()
  // .get('count')

  const numReports = await legacyKnex('downloaded_csvs')
  .count()
  .whereIn('cid', routelogIds)
  .first()
  .get('count')

  console.log(`Processing ${numReports} routelogs`)
  // console.log(`In total, they contain ${numRows} rows`)
  // const numOps = numReports * 10 + numRows * 7
  // console.log(`This process will require roughly ${numOps} database operations`)

  const eta = new Eta(numReports)

  await routelogs
  .tap(() => {
    eta.start()
  })
  .mapSeries(async csv => {
    const now = moment.tz(csv.started_at, 'America/Chicago').format()
    const startedAt = moment()
    .tz('America/Chicago')
    .format()
    console.log(
      `Processing the ${csv.source} routelog started at ${now} (actual time: ${startedAt} CST; cid: ${csv.cid})`
    )
    const timer = new Timer()
    timer.start('Total')
    timer.start('Initialization')
    const { WorkGroup, Company, DataImport } = rawModels
    const w2Company = await Company.query().findOne({ name: csv.source })
    const dataSource = await w2Company.$relatedQuery('dataSources').findOne({ name: 'Siebel Work Order Report' })
    const dataImport = await DataImport.query()
    .insert({ dataSourceId: dataSource.id, reportName: 'Siebel Work Order Report', createdAt: now })
    .returning('*')

    const rows = await legacyKnex('downloaded_csv_rows')
    .where({ csv_cid: csv.cid })
    .map(result => {
      const original_row = { ...result.data }
      const row = _.mapKeys(result.data, (value, key) =>
        key.replace(/[^a-zA-Z0-9~!@#$%^&*()\-+[\]{}|;',./<>?\s]/, '')
      )
      row.original_row = original_row
      row.HSP = w2Company.name
      row.Subcontractor =
            row['Tech Type'] === 'W2' || !row['Tech Type'] ? null : sanitizeCompanyName(row['Tech Type'])
      if (!row['Tech User ID'] || row['Tech User ID'] === 'UNKNOWN') row['Tech User ID'] = null
      const convertedRow = convertRowToStandardForm({ row })
      return convertedRow
    })

    await dataImport.$query().patch({
      status: 'Processing',
      downloadedAt: moment(now)
      .add(moment().diff(startedAt))
      .format(),
    })
    await handleStandardRows({ knex, rows, now })
    await dataImport.$query().patch({
      status: 'Complete',
      completedAt: moment(now)
      .add(moment().diff(startedAt))
      .format(),
    })
    await legacyKnex('downloaded_csvs')
    .update({ imported: true })
    .where({ cid: csv.cid })
    timer.stop('Total')
    eta.markOpComplete()
    outputEtaInfo(eta)
  })
}

const convertRowToStandardForm = ({ row }) => ({
  Source: 'Siebel',
  'Partner Name': row.HSP || '',
  Subcontractor: null,
  'Activity ID': row['Activity #'] || '',
  'Tech ID': row['Tech User ID'] || '',
  'Tech Name': null,
  'Team ID': null,
  'Team Name': null,
  'Service Region': row['SR'] || '',
  Office: null,
  DMA: null,
  Division: null,
  'Order Type': row['Order Type'] || '',
  Status: row['Status'] || '',
  'Reason Code': row['Reason Code'] || '',
  'Time Zone': row['Time Zone'] || '',
  'Created Date': row['Created Date (with timestamp)'] || '',
  'Due Date': row['Activity Due Date RT'] || '',
  'Planned Start Date': row['Planned Start Date RT'] || '',
  'Actual Start Date': row['Actual Start Date RT'] || '',
  'Actual End Date': row['Actual End Date RT'] || '',
  'Cancelled Date': row['Activity Cancelled Date'] || '',
  'Negative Reschedules': row['# of Negative Reschedules'] || '',
  'Planned Duration': row['Planned Duration (FS Scheduler)'] || '',
  'Actual Duration': row['Total Duration Minutes'] || '',
  'Service in 7 Days': '',
  'Repeat Service': '',
  'Internet Connectivity': row['Internet Connectivity'] === 'Y',
  'Customer ID': row['Cust Acct Number'] || '',
  'Customer Name': sanitizeName(row['Cust Name']) || '',
  'Customer Phone': sanitizeName(row['Home Phone']) || '',
  'Dwelling Type': row['Dwelling Type'] || '',
  Address: row['House #'] + ' ' + row['Street Name'],
  Zipcode: row['Zip'] || '',
  City: row['City'] || '',
  State: row['Service State'] || '',
  Latitude: row['Activity Geo Latitude'] / 1000000 || '',
  Longitude: row['Activity Geo Longitude'] / 1000000 || '',
})

run()
.catch(console.error)
.finally(() => {
  legacyKnex.destroy()
  knex.destroy()
})
