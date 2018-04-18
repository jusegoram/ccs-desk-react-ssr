import path from 'path'
import csv from 'csv'
import moment from 'moment-timezone'
import techProfileProcessor from 'server/data/processors/techProfile'
import siebelRoutelogProcessor from 'server/data/processors/routelog/siebel'
import edgeRoutelogProcessor from 'server/data/processors/routelog/edge'

const SiebelReportFetcher = require('./download/siebel/SiebelReportFetcher')
const convertStringToStream = require('./download/siebel/convertStringToStream')
const SanitizeStringStream = require('./download/siebel/SanitizeStringStream')

export default class Importer {
  static async importAll() {
    const goodmanImporter = new Importer({ companyName: 'Goodman' })
    // const directSatImporter = new Importer({ models, companyName: 'DirectSat' })
    await Promise.all([
      // goodmanImporter.importReport({ reportName: 'Tech Profile' }),
      // directSatImporter.importReport({ reportName: 'Tech Profile' }),
    ])
    await Promise.all([
      goodmanImporter.importReport({ reportName: 'Routelog' }),
      // directSatImporter.importReport({ reportName: 'Routelog' }),
      // goodmanImporter.importReport({ reportName: 'MW Routelog' }),
      // directSatImporter.importReport({ reportName: 'MW Routelog' }),
      // goodmanImporter.importReport({ reportName: 'SE Routelog' }),
      // directSatImporter.importReport({ reportName: 'SE Routelog' }),
      // goodmanImporter.importReport({ reportName: 'SW Routelog' }),
      // directSatImporter.importReport({ reportName: 'SW Routelog' }),
      // goodmanImporter.importReport({ reportName: 'W Routelog' }),
      // directSatImporter.importReport({ reportName: 'W Routelog' }),
    ])
  }

  static dataSourceForReport({ reportName }) {
    if (!Importer.reportDataSourceMap[reportName]) throw new Error("Couldn't find data source for report")
    return Importer.reportDataSourceMap[reportName]
  }

  constructor({ companyName }) {
    this.companyName = companyName
    this.credentials = Importer.credentials[companyName]
  }

  async importReport({ reportName }) {
    const { Company, DataImport } = this.models
    const dataSourceName = Importer.dataSourceForReport({ reportName })
    const w2Company = await Company.query().findOne({ name: this.companyName })
    const dataSource = await w2Company
    .$relatedQuery('dataSources')
    .where({ name: dataSourceName })
    .first()
    if (!dataSource) throw new Error('Unable to find that data source')
    const dataImport = await DataImport.query()
    .insert({ dataSourceId: dataSource.id, reportName })
    .returning('*')
    try {
      const exitHandler = async (options, err) => {
        if (options.cleanup) {
          await dataImport.$query().patch({ status: 'Aborted' })
        }
        if (err) console.log(err.stack) // eslint-disable-line no-console
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

      await dataImport.$query().patch({ status: 'Downloading' })
      const analyticsReportName = Importer.analyticsReportNames[dataSourceName][reportName]
      const csvString = await new SiebelReportFetcher(this.credentials).fetchReport(analyticsReportName, {
        loggingPrefix: 'CCS CLI',
        // screenshotsDirectory,
        // screenshotsPrefix: `${dataSource.service}_${dataSource.report}`,
        horsemanConfig: {
          cookiesFile: path.join(__dirname, `${this.companyName}_cookies.txt`),
        },
      })
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
      await Importer.processors[dataSourceName][reportName]({ csvObjStream, dataSource, w2Company })
      await dataImport.$query().patch({ status: 'Complete', completedAt: moment().format() })
    } catch (e) {
      await dataImport.$query().patch({ status: 'Errored' })
    }
  }

  static credentials = {
    Goodman: {
      username: 'MBMA090000',
      password: process.env.ANALYTICS_GOODMAN_PASSWORD,
    },
    DirectSat: {
      username: 'DSPA009875',
      password: process.env.ANALYTICS_DIRECTSAT_PASSWORD,
    },
  }

  static analyticsReportNames = {
    Siebel: {
      'Tech Profile': 'Tech Profile',
      Routelog: 'routelog',
    },
    Edge: {
      'MW Routelog': 'EDGEMW Bll',
      'SE Routelog': 'EDGESE Bll',
      'SW Routelog': 'EDGESW Bll',
      'W Routelog': 'EDGEW Bll',
    },
  }

  static processors = {
    Siebel: {
      'Tech Profile': techProfileProcessor,
      Routelog: siebelRoutelogProcessor,
    },
    Edge: {
      Routelog: edgeRoutelogProcessor,
      'MW Routelog': edgeRoutelogProcessor,
      'SE Routelog': edgeRoutelogProcessor,
      'SW Routelog': edgeRoutelogProcessor,
      'W Routelog': edgeRoutelogProcessor,
    },
  }

  static reportDataSourceMap = {
    'Tech Profile': 'Siebel',
    Routelog: 'Siebel',
    'MW Routelog': 'Edge',
    'SE Routelog': 'Edge',
    'SW Routelog': 'Edge',
    'W Routelog': 'Edge',
  }
}
