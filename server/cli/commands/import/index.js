import fs from 'fs'
import path from 'path'
import csv from 'csv'
import { DataImport, Company } from 'server/api/models'
import techProfileProcessor from 'server/cli/commands/import/processors/techProfile'
import siebelRoutelogProcessor from 'server/cli/commands/import/processors/routelog/siebel'
import edgeRoutelogProcessor from 'server/cli/commands/import/processors/routelog/edge'

const SiebelReportFetcher = require('./download/siebel/SiebelReportFetcher')
const convertStringToStream = require('./download/siebel/convertStringToStream')
const SanitizeStringStream = require('./download/siebel/SanitizeStringStream')

// const analyticsCredentials = {
//   'Goodman Analytics': {
//     username: process.env.ANALYTICS_GOODMAN_USERNAME,
//     password: process.env.ANALYTICS_GOODMAN_PASSWORD,
//   },
//   'DirectSat Analytics': {
//     username: process.env.ANALYTICS_DIRECTSAT_USERNAME,
//     password: process.env.ANALYTICS_DIRECTSAT_PASSWORD,
//   },
// }

const processors = {
  Siebel: {
    'Tech Profile': techProfileProcessor,
    Routelog: siebelRoutelogProcessor,
  },
  Edge: {
    'MW Routelog': edgeRoutelogProcessor,
  },
}
const mockFiles = {
  Goodman: {
    Siebel: {
      'Tech Profile': 'techProfile.csv',
      Routelog: 'routelog.csv',
    },
    Edge: {
      'MW Routelog': 'edge.mw.csv',
    },
  },
}

// const screenshotsDirectory = path.resolve(__dirname, 'screenshots')
module.exports = async ({ companyName, dataSourceName, reportName }) => {
  const w2Company = await Company.query().findOne({ name: companyName })
  const dataSource = await w2Company
  .$relatedQuery('dataSources')
  .where({ name: dataSourceName })
  .first()
  if (!dataSource) throw new Error('Unable to find that data source')
  const dataImport = await DataImport.query()
  .insert({ dataSourceId: dataSource.id, reportName })
  .returning('*')
  try {
    // const credentials = analyticsCredentials[service]
    await dataImport.$query().patch({ status: 'downloading' })
    // const csvString = await new SiebelReportFetcher(credentials).fetchReport(dataSource.report, {
    //   loggingPrefix: 'CCS CLI',
    //   // screenshotsDirectory,
    //   // screenshotsPrefix: `${dataSource.service}_${dataSource.report}`,
    //   horsemanConfig: {
    //     cookiesFile: path.join(__dirname, `${dataSource.service}_cookies.txt`),
    //   },
    // })
    const csvString = fs.readFileSync(path.resolve(__dirname, mockFiles[companyName][dataSourceName][reportName])) + ''
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
    await processors[dataSourceName][reportName]({ csvObjStream, dataSource, w2Company })
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
