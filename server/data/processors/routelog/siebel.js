import _ from 'lodash'
import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import { streamToArray } from 'server/util'
import sanitizeName from 'server/util/sanitizeName'
import Timer from 'server/util/Timer'
import handleStandardRows from 'server/data/processors/routelog/handleStandardRows'
import Promise from 'bluebird'

const convertRowToStandardForm = ({ row, w2Company, employee }) => {
  const standardRow = {
    Source: 'Siebel',
    'Partner Name': w2Company.name || '',
    Subcontractor: row['Tech Type'] || '',
    'Activity ID': row['Activity #'] || '',
    'Tech Siebel ID': row['Tech User ID'] || '',
    'Tech Edge ID': (employee && employee.externalId) || '',
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

/* Sample Row Data:
  { 'Time Zone': 'CENTRAL',
  'Activity Due Date': '4/19/18 16:00',
  'Activity Due Date RT': '4/19/18 12:00',
  'Planned Start Date RT': '4/19/18 8:00',
  'Actual Start Date RT': '',
  'Actual End Date RT': '',
  'Planned Duration (FS Scheduler)': '75',
  'Activity #': '1-2VSMN8EU',
  'Cust Acct Number': '53383365',
  SR: 'TX01',
  DMA: 'BEAUMONT TX',
  Office: computed,
  Division: computed,
  Status: 'Scheduled',
  'Reason Code': '',
  'Order Type': 'Service',
  'Tech User ID': 'MBTX031454',
  'Tech Full Name': 'GIBSON, GROVER',
  'Tech Team': 'MB000615',
  'Tech Type': 'W2',
  'Team Name': 'JONATHAN SHERILL',
  'Cust Name': 'MOYERS, JOHN MICHA',
  'House #': '9450',
  'Street Name': 'LANDIS DR',
  City: 'BEAUMONT',
  Zip: '77707',
  'Service County': 'Jefferson',
  'Service State': 'TX',
  'Home Phone': '4093500971',
  'Created Date (with timestamp)': '4/6/18 11:33',
  'Total Duration Minutes': '46',
  '# of Negative Reschedules': '1',
  'Activity Cancelled Date': '',
  'Activity Geo Longitude': '-94203680',
  'Activity Geo Latitude': '30066760',
  'Dwelling Type': 'Residential',
  'Internet Connectivity': 'Y',
  Timezone: '(GMT-06:00) Central Time (US & Canada)' }
*/

export default async ({ csvObjStream, w2Company, dataSource }) => {
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { WorkGroup, Employee } = models

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
    const datas = await streamToArray(csvObjStream, data => {
      const serviceRegion = data.SR
      const groups = srData[serviceRegion]
      if (groups) {
        data.DMA = groups.DMA
        data.Office = groups.Office
        data.Division = groups.Division
      }
      data.companyName = !data['Tech Type'] || data['Tech Type'] === 'W2' ? w2Company.name : data['Tech Type']
      if (!data['Tech User ID'] || data['Tech User ID'] === 'UNKNOWN') data['Tech User ID'] = null
      data.assignedTechId = data['Tech User ID']
      return data
    })

    const rows = await Promise.map(
      datas,
      async data => {
        const employee =
          data['Tech User ID'] &&
          (await Employee.query()
          .eager('[company, workGroups]')
          .findOne({ externalId: data['Tech User ID'] }))
        return convertRowToStandardForm({ row: data, w2Company, employee })
      },
      { concurrency: 40 }
    )

    await handleStandardRows({ rows, timer, models, dataSource, w2Company })
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
