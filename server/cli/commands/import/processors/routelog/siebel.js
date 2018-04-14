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
const times = {
  upsert: 0,
  other: 0,
  diff: 0,
  ensureWG: 0,
  newWG: 0,
  oldWG: 0,
}
export default async ({ csvObjStream, dataSource }) => {
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { WorkOrder, WorkGroup, Company } = models
    const knex = WorkOrder.knex()
    const dataSourceId = dataSource.id
    const workGroupCache = {}

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

    const getTimeDiff = t => {
      const diff = process.hrtime(t)
      return diff[0] * 1000000 + diff[1] / 1000
    }

    const dbWorkOrders = _.keyBy(
      await knex('WorkOrder')
      .where({ dataSourceId })
      .where(
        'date',
        '>=',
        moment
        .tz('America/Los_Angeles')
        .add(-1, 'day')
        .format('YYYY-MM-DD')
      ),
      'externalId'
    )

    await Promise.mapSeries(workOrderDatas, async data => {
      let start = process.hrtime()
      const dbWorkOrder = dbWorkOrders[data['Activity #']]
      const workOrderQuery = WorkOrder.query()
      .eager('workGroups')
      .where({ dataSourceId, externalId: data['Activity #'] })
      .first()
      if (!dbWorkOrder) {
        await WorkOrder.query().upsert({
          query: { dataSourceId: dataSource.id, externalId: data['Activity #'] },
          update: {
            date: getDateString(data['Activity Due Date']),
            type: data['Order Type'],
            status: data['Status'],
            data,
          },
        })
      } else if (!_.isEqual(dbWorkOrder.data, data)) {
        workOrderQuery
        .patch({
          date: getDateString(data['Activity Due Date']),
          type: data['Order Type'],
          status: data['Status'],
          data,
        })
        .returning('*')
      }
      const workOrder = await workOrderQuery
      times.upsert += getTimeDiff(start)

      start = process.hrtime()
      const company = await Company.query().ensure(data.companyName)

      const employeeId = data.assignedTechId
      const techTeamId = data['Tech Team']
      const workGroupDatas = [
        ...(employeeId && [
          {
            companyId: w2Company.id,
            type: 'Tech',
            externalId: employeeId,
            name: sanitizeName(data['Tech Full Name']),
          },
        ]),
        ...(techTeamId && [
          {
            companyId: w2Company.id,
            type: 'Team',
            externalId: techTeamId,
            name: sanitizeName(data['Team Name']),
          },
        ]),
        {
          companyId: w2Company.id,
          type: 'Company',
          externalId: w2Company.name,
          name: w2Company.name,
        },
        {
          companyId: company.id,
          type: 'Company',
          externalId: company.name,
          name: company.name,
        },
        ...(!!data.SR && [
          {
            companyId: w2Company.id,
            type: 'Service Region',
            externalId: data.SR,
            name: data.SR,
          },
          {
            companyId: w2Company.id,
            type: 'Office',
            externalId: data.Office,
            name: data.Office,
          },
          {
            companyId: w2Company.id,
            type: 'DMA',
            externalId: data.DMA,
            name: data.DMA,
          },
          {
            companyId: w2Company.id,
            type: 'Division',
            externalId: data.Division,
            name: data.Division,
          },
        ]),
      ]
      times.other += getTimeDiff(start)

      start = process.hrtime()
      const workGroupPrimaryKey = ['companyId', 'type', 'externalId']
      const hasSamePrimaryKey = (a, b) => _.isEqual(_.pick(a, workGroupPrimaryKey), _.pick(b, workGroupPrimaryKey))
      const newWorkGroupDatas = _.differenceWith(workGroupDatas, workOrder.workGroups, hasSamePrimaryKey)
      const obsoleteWorkGroups = _.differenceWith(workOrder.workGroups, workGroupDatas, hasSamePrimaryKey)
      times.diff += getTimeDiff(start)
      start = process.hrtime()
      const newWorkGroups = await Promise.map(newWorkGroupDatas, workGroupData =>
        WorkGroup.query().ensure(workGroupData, workGroupCache)
      )
      times.ensureWG += getTimeDiff(start)
      start = process.hrtime()
      await Promise.mapSeries(_.uniqBy(newWorkGroups, 'id'), workGroup =>
        knex('workGroupWorkOrders').insert({
          workOrderId: workOrder.id,
          workGroupId: workGroup.id,
        })
      )
      times.newWG += getTimeDiff(start)
      start = process.hrtime()
      await knex('workGroupWorkOrders')
      .where({ workOrderId: workOrder.id })
      .whereIn('workGroupId', _.map(obsoleteWorkGroups, 'id'))
      .delete()
      times.oldWG += getTimeDiff(start)
    })
    console.log(_.mapValues(times, time => time / 1000000))
  })
}
