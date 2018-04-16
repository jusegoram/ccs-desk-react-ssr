import _ from 'lodash'
import Promise from 'bluebird'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import moment from 'moment-timezone'
import { streamToArray } from 'server/util'
import Timer from 'server/util/Timer'

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

export default async ({ csvObjStream, dataSource }) => {
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { WorkOrder, WorkGroup, Company, Employee } = models
    const knex = WorkOrder.knex()
    const dataSourceId = dataSource.id
    const workGroupCache = {}

    timer.split('SR Data Load')
    const w2CompanyName = serviceW2Company[dataSource.service]
    const srData = _.keyBy(
      await WorkGroup.knex()
      .select('Service Region', 'Office', 'DMA', 'Division')
      .from('directv_sr_data')
      .where({ HSP: w2CompanyName }),
      'Service Region'
    )

    timer.split('Ensure Company')
    const w2Company = await Company.query().ensure(w2CompanyName)

    // timer.split('Stream to Array')
    const workOrderDatas = await streamToArray(csvObjStream, data => {
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

    timer.split('Load Existing')
    const dbWorkOrders = _.keyBy(
      await WorkOrder.query()
      .eager('workGroups')
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
      timer.split('Fetch Employee')
      const employee =
        data.assignedTechId &&
        (await Employee.query()
        .eager('[company, workGroups]')
        .first()
        .where({ alternateExternalId: data.assignedTechId }))

      data.row = convertRowToStandardForm({ row: data, w2Company, employee })

      timer.split('Work Order Upsert')
      const dbWorkOrder = dbWorkOrders[data['Activity ID']]
      let workOrder = dbWorkOrder
      if (!workOrder || !_.isEqual(workOrder.data, data)) {
        workOrder = await WorkOrder.query()
        .eager('workGroups')
        .upsert({
          query: { dataSourceId, externalId: data['Activity ID'] },
          update: {
            date: getDateString(data['Due Date']),
            type: data['Order Sub Type'],
            status: data['Status'],
            row: data.row,
          },
        })
      }

      timer.split('Work Group Datas')
      const workGroupDatas = [
        {
          companyId: w2Company.id,
          type: 'Company',
          externalId: w2Company.name,
          name: w2Company.name,
        },
        ...(!employee
          ? []
          : [
            ...employee.workGroups.map(workGroup => ({
              companyId: workGroup.companyId,
              type: workGroup.type,
              externalId: workGroup.externalId,
              name: workGroup.name,
            })),
          ]),
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

      timer.split('Work Groups _.differenceWith')
      const workGroupPrimaryKey = ['companyId', 'type', 'externalId']
      const hasSamePrimaryKey = (a, b) => _.isEqual(_.pick(a, workGroupPrimaryKey), _.pick(b, workGroupPrimaryKey))
      const newWorkGroupDatas = _.differenceWith(workGroupDatas, workOrder.workGroups, hasSamePrimaryKey)
      const obsoleteWorkGroups = _.differenceWith(workOrder.workGroups, workGroupDatas, hasSamePrimaryKey)

      timer.split('Ensure New Work Groups')
      const newWorkGroups = await Promise.map(newWorkGroupDatas, workGroupData =>
        WorkGroup.query().ensure(workGroupData, workGroupCache)
      )

      timer.split('Insert New Work Group Relations')
      await Promise.mapSeries(_.uniqBy(newWorkGroups, 'id'), workGroup =>
        knex('workGroupWorkOrders').insert({
          workOrderId: workOrder.id,
          workGroupId: workGroup.id,
        })
      )

      timer.split('Delete Old Work Group Relations')
      if (obsoleteWorkGroups.length) {
        await knex('workGroupWorkOrders')
        .where({ workOrderId: workOrder.id })
        .whereIn('workGroupId', _.map(obsoleteWorkGroups, 'id'))
        .delete()
      }
    })
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
