import _ from 'lodash'
import Promise from 'bluebird'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import moment from 'moment-timezone'
import { streamToArray } from 'server/util'
import sanitizeName from 'server/util/sanitizeName'

const serviceW2Company = {
  'Goodman Analytics': 'Goodman',
  'DirectSat Analytics': 'DirectSat',
}
const getDateString = timeString => {
  if (!timeString) return null
  const badDateString = timeString.split(' ')[0]
  const date = moment(badDateString, 'M/D/YY')
  if (!date.isValid()) return null
  return date.format('YYYY-MM-DD')
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

export default async ({ csvObjStream, dataSource }) => {
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { WorkOrder, WorkGroup, Company, Employee } = models

    const w2CompanyName = serviceW2Company[dataSource.service]
    const srData = _.keyBy(
      await WorkGroup.knex()
      .select('Service Region', 'Office', 'DMA', 'Division')
      .from('directv_sr_data')
      .where({ HSP: w2CompanyName }),
      'Service Region'
    )

    const w2Company = await Company.query().ensure(w2CompanyName)

    const workOrderDatas = await streamToArray(csvObjStream, data => {
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

    await Promise.mapSeries(workOrderDatas, async data => {
      const workOrder = await WorkOrder.query().upsert({
        query: { dataSourceId: dataSource.id, externalId: data['Activity #'] },
        update: {
          date: getDateString(data['Activity Due Date']),
          type: data['Order Type'],
          status: data['Status'],
          data,
        },
      })

      const company = await Company.query().ensure(data.companyName)

      const employeeId = data.assignedTechId
      const techTeamId = data['Tech Team']
      const workGroups = await Promise.all([
        ...(employeeId && [
          WorkGroup.query().ensure({
            type: 'Tech',
            companyId: w2Company.id,
            externalId: employeeId,
            name: sanitizeName(data['Tech Full Name']),
          }),
        ]),
        ...(techTeamId && [
          WorkGroup.query().ensure({
            type: 'Team',
            companyId: w2Company.id,
            externalId: techTeamId,
            name: sanitizeName(data['Team Name']),
          }),
        ]),
        WorkGroup.query().ensure({
          type: 'Company',
          companyId: w2Company.id,
          externalId: w2Company.name,
          name: w2Company.name,
        }),
        WorkGroup.query().ensure({
          type: 'Company',
          companyId: company.id,
          externalId: company.name,
          name: company.name,
        }),
        ...(!!data.SR && [
          WorkGroup.query().ensure({
            type: 'Service Region',
            companyId: w2Company.id,
            externalId: data.SR,
            name: data.SR,
          }),
          WorkGroup.query().ensure({
            type: 'Office',
            companyId: w2Company.id,
            externalId: data.Office,
            name: data.Office,
          }),
          WorkGroup.query().ensure({
            type: 'DMA',
            companyId: w2Company.id,
            externalId: data.DMA,
            name: data.DMA,
          }),
          WorkGroup.query().ensure({
            type: 'Division',
            companyId: w2Company.id,
            externalId: data.Division,
            name: data.Division,
          }),
        ]),
      ])

      workOrder.$setRelated('workGroups', workGroups)
      await WorkOrder.query().upsertGraph(workOrder, { relate: true, unrelate: true })
      // await workOrder.$query().patch({ workGroupId: techWorkGroups.tech.id })
    })
  })
}
