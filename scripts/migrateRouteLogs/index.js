import Knex from 'knex'
import _ from 'lodash'
import { transaction, Model } from 'objection'
import * as rawModels from 'server/api/models'
import sanitizeName from 'server/util/sanitizeName'
import Timer from 'server/util/Timer'
import handleStandardRows from 'server/cli/commands/import/processors/routelog/handleStandardRows'
import sanitizeCompanyName from 'server/cli/commands/import/processors/sanitizeCompanyName'
import moment from 'moment-timezone'
import Eta from 'node-eta'

import knexfile from '../../knexfile'

const legacyKnex = Knex(knexfile['legacy'])
const knex = Knex(knexfile['production'])

const etaLayout =
  '{{elapsed}} elapsed, {{rate}} rate, {{estimated}} estimated, {{progress}} progress, {{eta}} eta, {{etah}} etah, {{last}} last'

Model.knex(knex)

const run = async () => {
  // .where('started_at', '<=', '2018-05-03T17:00:00-500')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')

    const routelogs = legacyKnex('downloaded_csvs')
    .where('started_at', '>=', '2018-04-01T04:00:00-500')
    .where('imported', false)
    .where({ saturate_status: 'Complete' })
    .where({ report_name: 'Routelog' })
    .orderBy('started_at')
    .limit(3)
    const routelogIds = routelogs.clone().select('cid')

    const numRows = await legacyKnex('downloaded_csv_rows')
    .count('id', 'rows')
    .whereIn('csv_cid', routelogIds)
    .first()
    .get('count')

    const numReports = await legacyKnex('downloaded_csvs')
    .count()
    .whereIn('cid', routelogIds)
    .first()
    .get('count')

    console.log(`Processing ${numReports} routelogs`)
    console.log(`In total, they contain ${numRows} rows`)
    const numOps = numReports * 9 + numRows * 7
    console.log(`This process require roughly ${numOps} database operations`)

    const eta = new Eta(numReports)

    await routelogs.mapSeries(async (csv, csvIndex) => {
      eta.iterate(csvIndex)
      console.log(eta.format(etaLayout))
      const now = moment.tz(csv.started_at, 'America/Chicago').format()
      const startedAt = moment()
      console.log(
        `Processing the ${csv.source} routelog started at ${now} (actual time: ${moment
        .tz('America/Chicago')
        .format()})`
      )
      const timer = new Timer()
      timer.start('Total')
      timer.start('Initialization')
      const { WorkGroup, Company, DataImport } = models
      const w2Company = await Company.query().findOne({ name: csv.source })
      const dataSource = await w2Company.$relatedQuery('dataSources').findOne({ name: 'Siebel Routelog' })
      const dataImport = await DataImport.query()
      .insert({ dataSourceId: dataSource.id, reportName: 'Siebel Routelog', createdAt: now })
      .returning('*')

      timer.split('SR Data Load')
      const w2CompanyName = w2Company.name
      const srData = _.keyBy(
        await WorkGroup.knex()
        .select('Service Region', 'Office', 'DMA', 'Division')
        .from('directv_sr_data')
        .where({ HSP: w2CompanyName }),
        'Service Region'
      )

      timer.split('Stream to Array')

      const rows = await legacyKnex('downloaded_csv_rows')
      .where({ csv_cid: csv.cid })
      .map(csvRow => {
        const data = {}
        csv.header_order.forEach(header => {
          data[header] = csvRow.data[header]
        })
        const serviceRegion = data.SR
        const groups = srData[serviceRegion]
        if (groups) {
          data.DMA = groups.DMA
          data.Office = groups.Office
          data.Division = groups.Division
        }
        data.companyName = !data['Tech Type'] || data['Tech Type'] === 'W2' ? w2Company.name : data['Tech Type']
        data['Tech Type'] = sanitizeCompanyName(data['Tech Type'])
        if (!data['Tech User ID'] || data['Tech User ID'] === 'UNKNOWN') data['Tech User ID'] = null
        data.assignedTechId = data['Tech User ID']
        return convertRowToStandardForm({ row: data, w2Company })
      })

      await dataImport.$query().patch({
        status: 'Processing',
        downloadedAt: moment(now)
        .add(moment().diff(startedAt))
        .format(),
      })
      await handleStandardRows({ rows, timer, models, dataSource, w2Company, now })
      await dataImport.$query().patch({
        status: 'Complete',
        completedAt: moment(now)
        .add(moment().diff(startedAt))
        .format(),
      })
      timer.stop('Total')
      console.log(timer.toString()) //
    })
  })
}

const convertRowToStandardForm = ({ row, w2Company }) => {
  const standardRow = {
    Source: 'Siebel',
    'Partner Name': w2Company.name || '',
    Subcontractor: row['Tech Type'] || '',
    'Activity ID': row['Activity #'] || '',
    'Tech ID': row['Tech User ID'] || '',
    'Tech Name': sanitizeName(row['Tech Full Name']) || '',
    'Tech Team': row['Tech Team'] || '',
    'Tech Supervisor': sanitizeName(row['Team Name']) || '',
    'Order Type': row['Order Type'] || '',
    Status: row['Status'] || '',
    'Reason Code': row['Reason Code'] || '',
    'Service Region': row['SR'] || '',
    DMA: row['DMA'] || '',
    Office: row['Office'] || '',
    Division: row['Division'] || '',
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
  }
  return standardRow
}

run()
.catch(console.error)
.finally(() => {
  legacyKnex.destroy()
  knex.destroy()
})
