// import fs from 'fs'
import path from 'path'
import csv from 'csv'
import moment from 'moment-timezone'
import { DataImport, Company } from 'server/api/models'
import techProfileProcessor from './processors/techProfile'
import siebelRoutelogProcessor from './processors/routelog/siebel'
import edgeRoutelogProcessor from './processors/routelog/edge'
import closedProcessor from './processors/closed'
import DataSource from 'server/api/models/DataSource'

const SiebelReportFetcher = require('./download/siebel/SiebelReportFetcher')
const convertStringToStream = require('./download/siebel/convertStringToStream')
const SanitizeStringStream = require('./download/siebel/SanitizeStringStream')

const analyticsCredentials = {
  Goodman: {
    username: 'MBMA090000',
    password: process.env.ANALYTICS_GOODMAN_PASSWORD,
  },
  DirectSat: {
    username: 'DSPA009875',
    password: process.env.ANALYTICS_DIRECTSAT_PASSWORD,
  },
}

const analyticsReportNames = {
  Siebel: {
    'Tech Profile': 'Tech Profile',
    Routelog: 'routelog',
    Sclosed: 'Sclosed',
  },
  Edge: {
    'MW Routelog': 'EDGEMW Bll',
    'SE Routelog': 'EDGESE Bll',
    'SW Routelog': 'EDGESW Bll',
    'W Routelog': 'EDGEW Bll',
  },
}

const processors = {
  Siebel: {
    'Tech Profile': techProfileProcessor,
    Routelog: siebelRoutelogProcessor,
    Sclosed: closedProcessor,
  },
  Edge: {
    'MW Routelog': edgeRoutelogProcessor,
    'SE Routelog': edgeRoutelogProcessor,
    'SW Routelog': edgeRoutelogProcessor,
    'W Routelog': edgeRoutelogProcessor,
  },
}

const dataSourceNames = {
  'Tech Profile': 'Tech Report',
  Routelog: 'Siebel Work Order Report',
  'MW Routelog': 'Edge MW Work Order Report',
  'SE Routelog': 'Edge SE Work Order Report',
  'SW Routelog': 'Edge SW Work Order Report',
  'W Routelog': 'Edge W Work Order Report',
  Sclosed: 'SDCR',
}
// const mockFiles = {
//   Goodman: {
//     Siebel: {
//       // 'Tech Profile': 'full/Goodman/techProfile.csv',
//       'Tech Profile': 'techProfile.csv',
//       // Routelog: 'full/Goodman/routelog.csv',
//       Routelog: 'routelog.csv',
//     },
//     Edge: {
//       // 'MW Routelog': 'full/Goodman/edge.mw.csv',
//       'MW Routelog': 'edge.mw.csv',
//       'SE Routelog': 'full/Goodman/edge.se.csv',
//       'SW Routelog': 'full/Goodman/edge.sw.csv',
//     },
//   },
//   DirectSat: {
//     Siebel: {
//       'Tech Profile': 'full/DirectSat/techProfile.csv',
//       Routelog: 'full/DirectSat/routelog.csv',
//     },
//     Edge: {
//       'MW Routelog': 'full/DirectSat/edge.mw.csv',
//       'SE Routelog': 'full/DirectSat/edge.se.csv',
//       'SW Routelog': 'full/DirectSat/edge.sw.csv',
//     },
//   },
// }

// const screenshotsDirectory = path.resolve(__dirname, 'screenshots')
module.exports = async ({ knex, companyName, dataSourceName, reportName }) => {
  //eslint-disable-next-line no-console
  console.log('Data import script started at: ' + moment.tz('America/Chicago').format('LLLL'))
  if (moment.tz('America/Chicago').hour() < 4) return
  const w2Company = await Company.query().findOne({ name: companyName })
  const dataSource = await DataSource.query()
  .where({ name: dataSourceNames[reportName] }) // confusing, I know
  .where('companyId', w2Company.id)
  .first()
  if (!dataSource) throw new Error(`Unable to find data source named ${dataSourceNames[reportName]}`)
  const dataImport = await DataImport.query()
  .insert({ dataSourceId: dataSource.id, reportName: dataSourceNames[reportName] })
  .returning('*')
  try {
    process.stdin.resume() //so the program will not close instantly

    const exitHandler = (options, err) => {
      if (options.cleanup) {
        dataImport.$query().patch({ status: 'Aborted' })
      }
      if (err) console.log(err.stack)
      if (options.exit) process.exit()
    }

    //do something when app is closing
    process.on('exit', exitHandler.bind(null, { cleanup: true }))

    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, { exit: true }))

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, { exit: true }))
    process.on('SIGUSR2', exitHandler.bind(null, { exit: true }))

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, { exit: true }))

    const credentials = analyticsCredentials[companyName]
    await dataImport.$query().patch({ status: 'Downloading' })
    const reportFetcher = new SiebelReportFetcher(credentials, companyName)
    const csvString = await reportFetcher.fetchReport(reportName)
    console.log('closing browser')
    await reportFetcher.close()
    console.log('browser closed')
    // const mockFile = mockFiles[companyName][dataSourceName][reportName]
    // const csvString = fs.readFileSync(path.resolve(__dirname, 'mock_csvs', mockFile)) + ''
    const csvObjStream = convertStringToStream(csvString)
    .pipe(new SanitizeStringStream())
    .pipe(
      csv.parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
      })
    )
    await dataImport.$query().patch({ status: 'Processing', downloadedAt: moment().format() })
    const now = moment().format()
    await processors[dataSourceName][reportName]({ knex, csvObjStream, w2Company, now })
    await dataImport.$query().patch({ status: 'Complete', completedAt: moment().format() })
  } catch (e) {
    await dataImport.$query().patch({ status: 'Errored' })
    throw e
  }
}
