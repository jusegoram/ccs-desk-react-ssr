import _ from 'lodash'
import Promise from 'bluebird'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import { streamToArray } from 'server/util'
import Timer from 'server/util/Timer'
import handleStandardRows from 'server/cli/commands/import/processors/routelog/handleStandardRows'
import sanitizeCompanyName from '../sanitizeCompanyName'

const convertRowToStandardForm = ({ row, employee }) => ({
  const getWorkGroup = type => (employee && _.find(employee.workGroups, { type })) || {}
  Source: 'Edge',
  'Partner Name': row.HSP || '',
  Subcontractor: getWorkGroup('Subcontractor').externalId || '',
  'Activity ID': row['Activity ID'] || '',
  'Tech ID': row['Tech ID'] || '', // this is updated below to be the Siebel ID
  'Tech Name': (employee && employee.name) || '',
  'Tech Team': getWorkGroup('Team').externalId || '',
  'Tech Supervisor': getWorkGroup('Team').name || '',
  'Service Region': row['Service Region'] || '',
  'Order Type': row['Order Sub Type'] || '',
  Status: row['Status'] || '',
  'Reason Code': row['Hold Reason Code'] || '',
  'Time Zone': row['Timezone'] || '',
  'Created Date': '',
  'Due Date': row['Due Date'] || '',
  'Planned Start Date': row['Planned Start Date'] || '',
  'Actual Start Date': row['Actual Start Date'] || '',
  'Actual End Date': row['Actual End Date'] || '',
  'Cancelled Date': row['Status'] !== 'Cancelled' ? '' : row['Last Updated Date'],
  'Negative Reschedules': row['Negative Reschedule Count'] || '',
  'Planned Duration': row['Duration'],
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
})

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

export default async ({ knex, csvObjStream, w2Company, now }) => {
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  const { Tech } = rawModels

  timer.split('Load techs')
  const techsByEdgeId = _.keyBy(await Tech.query().eager('workGroups'), 'alternateExternalId')

  timer.split('Stream to Array')
  const rows = await streamToArray(csvObjStream, data => {
    data = _.mapKeys(data, (value, key) => key.replace(/[^a-zA-Z0-9#\s]/, ''))
    data.HSP = w2Company.name
    data.Subcontractor =
      data['Tech Type'] === 'W2' || !data['Tech Type'] ? null : sanitizeCompanyName(data['Tech Type'])
    if (!data['Tech ID'] || data['Tech ID'] === 'UNKNOWN') data['Tech ID'] = null
    const employee = data['Tech ID'] && techsByEdgeId[data['Tech ID']] && techsByEdgeId[data['Tech ID']]
    data['Tech ID'] = employee && employee.externalId
    return convertRowToStandardForm({ row: data, employee })
  })

  timer.split('Process Rows')
  await handleStandardRows({ knex, rows, now })

  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
