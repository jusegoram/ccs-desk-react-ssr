import _ from 'lodash'
import Promise from 'bluebird'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import { streamToArray } from 'server/util'
import Timer from 'server/util/Timer'
import handleStandardRows from 'server/cli/commands/import/processors/routelog/handleStandardRows'

const convertRowToStandardForm = ({ row, w2Company, employee }) => {
  const getWorkGroup = type => (employee && _.find(employee.workGroups, { type })) || {}
  const standardRow = {
    Source: 'Edge',
    'Partner Name': w2Company.name || '',
    Subcontractor: (employee && employee.company.name) || '',
    'Activity ID': row['Activity ID'] || '',
    'Tech ID': (employee && employee.alternateExternalId) || '',
    'Tech Name': (employee && employee.name) || '',
    'Tech Team': getWorkGroup('Team').externalId || '',
    'Tech Supervisor': getWorkGroup('Team').name || '',
    'Order Type': row['Order Sub Type'] || '',
    Status: row['Status'] || '',
    'Reason Code': row['Hold Reason Code'] || '',
    'Service Region': row['Service Region'] || '',
    DMA: row['DMA'] || '',
    Office: row['Office'] || '',
    Division: row['Division'] || '',
    'Time Zone': row['Timezone'] || '',
    'Created Date': '',
    'Due Date': row['Due Date'] || '',
    'Planned Start Date': row['Planned Start Date'] || '',
    'Actual Start Date': row['Actual Start Date'] || '',
    'Actual End Date': row['Actual End Date'] || '',
    'Cancelled Date': '',
    'Negative Reschedules': row['Negative Reschedule Count'] || '',
    'Planned Duration': '',
    'Actual Duration': '',
    'Service in 7 Days': row['Service Within 7 Days Flag'] === 'Y',
    'Repeat Service': row['Repeat Service Flag'] === 'Y',
    'Internet Connectivity': '',
    'Customer ID': '',
    'Customer Name': '',
    'Customer Phone': '',
    'Dwelling Type': '',
    Address: row['Address'] || '',
    Zipcode: (row['Zipcode'] && row['Zipcode'].slice(0, 5)) || '',
    City: row['City'] || '',
    State: row['State'] || '',
    Latitude: '',
    Longitude: '',
  }
  return standardRow
}

/* Sample Row Data:
  { Timezone: 'CENTRAL',
  'Partner Name': 'MULTIBAND',
  DMA: 'CHAMPAIGN IL',
  'Service Region': 'IL20',
  'Sub Area': 'New Install',
  Status: 'Closed',
  'Hold Reason Code': '',
  'Tech ID': 'CG185B',
  'Activity ID': 'M8093014025',
  'Order Sub Type': 'New Install',
  'Actual Start Date': '4/9/18 10:04',
  'Actual End Date': '4/9/18',
  Month: 'Apr',
  'Due Date': '4/9/18 23:59',
  'Planned Start Date': '4/9/18 10:04',
  'Service Within 7 Days Flag': 'N',
  'Repeat Service Flag': 'N',
  'Negative Reschedule Count': '0',
  Address: '703 ARLINGTON CT',
  City: 'CHMP',
  Zipcode: '618205001',
  State: 'IL',
  '# of Activities': '1' }
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

    // timer.split('Stream to Array')
    const datas = await streamToArray(csvObjStream, data => {
      const serviceRegion = data['Service Region']
      const groups = srData[serviceRegion]
      if (groups) {
        data.SR = serviceRegion
        data.DMA = groups.DMA
        data.Office = groups.Office
        data.Division = groups.Division
      }
      if (!data['Tech ID'] || data['Tech ID'] === 'UNKNOWN') data['Tech ID'] = null
      data.assignedTechId = data['Tech ID']
      return data
    })

    const rows = await Promise.mapSeries(datas, async data => {
      const employee = await Employee.query()
      .eager('[company, workGroups]')
      .findOne({ alternateExternalId: data['Tech ID'] })
      return convertRowToStandardForm({ row: data, w2Company, employee })
    })

    await handleStandardRows({ rows, timer, models, dataSource, w2Company })
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
