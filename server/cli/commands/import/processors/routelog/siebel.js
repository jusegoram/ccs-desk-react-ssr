import _ from 'lodash'
import Promise from 'bluebird'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import moment from 'moment-timezone'
import { streamToArray } from 'server/util'
import sanitizeName from 'server/util/sanitizeName'
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

const convertRowToStandardForm = ({ row, w2Company }) => {
  const standardRow = {
    Source: 'Siebel',
    'Partner Name': w2Company.name || '',
    Subcontractor: row['Tech Type'] || '',
    'Activity ID': row['Activity #'] || '',
    'Tech ID': row['Tech User ID'] || '',
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
  // { 'Time Zone': 'CENTRAL',
  'Activity Due Date': '4/19/18 16:00',
  // 'Activity Due Date RT': '4/19/18 12:00',
  // 'Planned Start Date RT': '4/19/18 8:00',
  // 'Actual Start Date RT': '',
  // 'Actual End Date RT': '',
  // 'Planned Duration (FS Scheduler)': '75',
  // 'Activity #': '1-2VSMN8EU',
  // 'Cust Acct Number': '53383365',
  // SR: 'TX01',
  // DMA: 'BEAUMONT TX',
  // Office: computed,
  // Division: computed,
  // Status: 'Scheduled',
  // 'Reason Code': '',
  // 'Order Type': 'Service',
  // 'Tech User ID': 'MBTX031454',
  // 'Tech Full Name': 'GIBSON, GROVER',
  // 'Tech Team': 'MB000615',
  // 'Tech Type': 'W2',
  // 'Team Name': 'JONATHAN SHERILL',
  // 'Cust Name': 'MOYERS, JOHN MICHA',
  // 'House #': '9450',
  // 'Street Name': 'LANDIS DR',
  // City: 'BEAUMONT',
  // Zip: '77707',
  // 'Service County': 'Jefferson',
  // 'Service State': 'TX',
  // 'Home Phone': '4093500971',
  // 'Created Date (with timestamp)': '4/6/18 11:33',
  // 'Total Duration Minutes': '46',
  // '# of Negative Reschedules': '1',
  // 'Activity Cancelled Date': '',
  // 'Activity Geo Longitude': '-94203680',
  // 'Activity Geo Latitude': '30066760',
  // 'Dwelling Type': 'Residential',
  // 'Internet Connectivity': 'Y',
  // Timezone: '(GMT-06:00) Central Time (US & Canada)' }
*/

export default async ({ csvObjStream, dataSource }) => {
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { WorkOrder, WorkGroup, Company, Appointment, Employee } = models
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

    timer.split('Stream to Array')
    const workOrderDatas = await streamToArray(csvObjStream, data => {
      const serviceRegion = data.SR
      const groups = srData[serviceRegion]
      if (groups) {
        data.DMA = groups.DMA
        data.Office = groups.Office
        data.Division = groups.Division
      }
      data.row = convertRowToStandardForm({ row: data, w2Company })
      data.companyName = !data['Tech Type'] || data['Tech Type'] === 'W2' ? w2Company.name : data['Tech Type']
      if (!data['Tech User ID'] || data['Tech User ID'] === 'UNKNOWN') data['Tech User ID'] = null
      data.assignedTechId = data['Tech User ID']
      return data
    })

    timer.split('Load Existing')
    const dbWorkOrders = _.keyBy(
      await WorkOrder.query()
      .eager('[workGroups, appointments]')
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
      timer.split('Work Order Upsert')
      const dbWorkOrder = dbWorkOrders[data['Activity #']]
      let workOrder = dbWorkOrder
      if (!workOrder || !_.isEqual(workOrder.data, data)) {
        workOrder = await WorkOrder.query()
        .eager('[workGroups, appointments]')
        .upsert({
          query: { dataSourceId, externalId: data['Activity #'] },
          update: {
            date: getDateString(data['Activity Due Date']),
            type: data['Order Type'],
            status: data['Status'],
            row: data.row,
          },
        })
      }

      let currentAppointment = _.find(workOrder.appointments, { date: workOrder.date })
      if (!currentAppointment || !_.isEqual(currentAppointment.data, data)) {
        const employee = await Employee.query()
        .first()
        .where({ dataSourceId, externalId: data.assignedTechId })
        currentAppointment = await Appointment.query().upsert({
          query: {
            workOrderId: workOrder.id,
            employeeId: employee.id,
            date: workOrder.date,
          },
          update: {
            status: workOrder.status,
            row: data.row,
          },
        })
        await workOrder.$relatedQuery('appointments').relate(currentAppointment)
        await employee.$relatedQuery('appointments').relate(currentAppointment)
      }

      timer.split('Ensure Company')
      const company = await Company.query().ensure(data.companyName)

      timer.split('Work Group Datas')
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
