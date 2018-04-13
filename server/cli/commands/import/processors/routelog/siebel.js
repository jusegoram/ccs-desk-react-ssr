import _ from 'lodash'
import Promise from 'bluebird'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import moment from 'moment-timezone'
import { streamToArray } from 'server/util'

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
      if (!data['Tech User ID'] || data['Tech User ID'] === 'UNKNOWN') data['Tech User ID'] = null
      data.assignedTechId = data['Tech User ID']
      return data
    })

    await Promise.mapSeries(workOrderDatas, async data => {
      const workOrder = await WorkOrder.query().upsert({
        query: { externalId: data['Activity #'] },
        update: {
          dataSourceId: dataSource.id,
          date: getDateString(data['Activity Due Date']),
          type: data['Order Type'],
          status: data['Status'],
          // data: data,
        },
      })
      // const assignedTech = data.assignedTechId && await Employee.query().eager('workGroups').where({ externalId: data.assignedTechId })

      // const workGroups = await Promise.props({
      //   ...(!!tech: WorkGroup.query().ensure({
      //     w2Company,
      //     type: 'Tech',
      //     companyId: w2Company.id,
      //     externalId: employee.externalId,
      //     name: employee.name,
      //   }),
      //   team: WorkGroup.query().ensure({
      //     w2Company,
      //     type: 'Team',
      //     companyId: w2Company.id,
      //     externalId: techData['Team ID'],
      //     name: techData['Team ID'],
      //   }),
      //   w2Company: WorkGroup.query().ensure({
      //     w2Company,
      //     type: 'Company',
      //     companyId: w2Company.id,
      //     externalId: w2Company.name,
      //     name: w2Company.name,
      //   }),
      //   company: WorkGroup.query().ensure({
      //     w2Company,
      //     type: 'Company',
      //     companyId,
      //     externalId: company.name,
      //     name: company.name,
      //   }),
      //   ...(!!techSrData && {
      //     serviceRegion: WorkGroup.query().ensure({
      //       w2Company,
      //       type: 'Service Region',
      //       companyId: w2Company.id,
      //       externalId: techSR,
      //       name: techSR,
      //     }),
      //     office: WorkGroup.query().ensure({
      //       w2Company,
      //       type: 'Office',
      //       companyId: w2Company.id,
      //       externalId: techSrData['Office'],
      //       name: techSrData['Office'],
      //     }),
      //     dma: WorkGroup.query().ensure({
      //       w2Company,
      //       type: 'DMA',
      //       companyId: w2Company.id,
      //       externalId: techSrData['DMA'],
      //       name: techSrData['DMA'],
      //     }),
      //     division: WorkGroup.query().ensure({
      //       w2Company,
      //       type: 'Division',
      //       companyId: w2Company.id,
      //       externalId: techSrData['Division'],
      //       name: techSrData['Division'],
      //     }),
      //   }),
      // })
    })
  })
}
