import fs from 'fs'
import path from 'path'
import csv from 'csv'
import { DataImport, DataSource } from 'server/api/models'
import techProfileProcessor from 'server/cli/commands/import/processors/techProfile'
import siebelRoutelogProcessor from 'server/cli/commands/import/processors/routelog/siebel'

const SiebelReportFetcher = require('./download/siebel/SiebelReportFetcher')
const convertStringToStream = require('./download/siebel/convertStringToStream')
const SanitizeStringStream = require('./download/siebel/SanitizeStringStream')

const analyticsCredentials = {
  'Goodman Analytics': {
    username: process.env.ANALYTICS_GOODMAN_USERNAME,
    password: process.env.ANALYTICS_GOODMAN_PASSWORD,
  },
  'DirectSat Analytics': {
    username: process.env.ANALYTICS_DIRECTSAT_USERNAME,
    password: process.env.ANALYTICS_DIRECTSAT_PASSWORD,
  },
}

const processors = {
  'Tech Profile': techProfileProcessor,
  'Siebel Routelog': siebelRoutelogProcessor,
}
const mockFiles = {
  'Tech Profile': 'techProfile.full.csv',
  'Siebel Routelog': 'routelog.csv',
}

// const screenshotsDirectory = path.resolve(__dirname, 'screenshots')
module.exports = async ({ service, name }) => {
  const dataSource = await DataSource.query()
  .where({ service, name })
  .first()
  if (!dataSource) throw new Error('Unable to find that data source')
  const dataImport = await DataImport.query()
  .insert({ dataSourceId: dataSource.id })
  .returning('*')
  try {
    const credentials = analyticsCredentials[service]
    await dataImport.$query().patch({ status: 'downloading' })
    // const csvString = await new SiebelReportFetcher(credentials).fetchReport(dataSource.report, {
    //   loggingPrefix: 'CCS CLI',
    //   // screenshotsDirectory,
    //   // screenshotsPrefix: `${dataSource.service}_${dataSource.report}`,
    //   horsemanConfig: {
    //     cookiesFile: path.join(__dirname, `${dataSource.service}_cookies.txt`),
    //   },
    // })
    const csvString = fs.readFileSync(path.resolve(__dirname, mockFiles[name])) + ''
    const csvObjStream = convertStringToStream(csvString)
    .pipe(new SanitizeStringStream())
    .pipe(
      csv.parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
      })
    )
    // cleanCsvStream.pipe(fs.createWriteStream(path.resolve(__dirname, 'techProfile.csv')))
    await dataImport.$query().patch({ status: 'processing', downloadedAt: new Date() })
    console.time('Processor Runtime')
    await processors[name]({ csvObjStream, dataSource })
    console.timeEnd('Processor Runtime')
  } catch (e) {
    await dataImport.$query().patch({ status: 'errored' })
    throw e
  }
  // await csvDbRecord.indicateSaturationRunning()
  // try {
  //   await Saturate[reportName]({ knex, source, csv_cid: csvDbRecord.cid, csv: csvDbRecord })
  //   await csvDbRecord.indicateSaturationCompleted()
  // } catch (e) {
  //   await csvDbRecord.indicateSaturationErrored(e)
  //   throw e
  // }
}

module.exports.reports = Object.keys(SiebelReportFetcher.availableReports)
