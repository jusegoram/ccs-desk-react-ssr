import _ from 'lodash'
import Promise from 'bluebird'
import moment from 'moment-timezone'

const getDateString = timeString => {
  if (!timeString) return null
  const badDateString = timeString.split(' ')[0]
  let date = moment(badDateString, 'M/D/YY')
  if (!date.isValid()) date = moment(badDateString, 'YYYY-MM-DD')
  if (!date.isValid()) return null
  return date.format('YYYY-MM-DD')
}

export default async ({ rows, timer, models, dataSource, w2Company }) => {
  const { WorkOrder, WorkGroup, Company, Appointment, Employee } = models
  const knex = WorkOrder.knex()
  const dataSourceId = dataSource.id
  const workGroupCache = {}

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

  await Promise.mapSeries(rows, async data => {
    timer.split('Work Order Upsert')
    const dbWorkOrder = dbWorkOrders[data['Activity ID']]
    let workOrder = dbWorkOrder
    if (!workOrder || !_.isEqual(workOrder.data, data)) {
      workOrder = await WorkOrder.query()
      .eager('[workGroups, appointments]')
      .upsert({
        query: { dataSourceId, externalId: data['Activity ID'] },
        update: {
          date: getDateString(data['Due Date']),
          type: data['Order Type'],
          status: data['Status'],
          row: data,
        },
      })
    }

    timer.split('Appointment Upsert')
    let currentAppointment = _.find(workOrder.appointments, { date: workOrder.date })
    if (!currentAppointment || !_.isEqual(currentAppointment.data, data)) {
      const employee = await Employee.query()
      .first()
      .where({ dataSourceId, externalId: data['Activity ID'] })

      currentAppointment = await Appointment.query().upsert({
        query: {
          workOrderId: workOrder.id,
          ...(employee && { employeeId: employee.id }),
          date: workOrder.date,
        },
        update: {
          status: workOrder.status,
          row: data,
        },
      })
      await workOrder.$relatedQuery('appointments').relate(currentAppointment)
      employee && (await employee.$relatedQuery('appointments').relate(currentAppointment))
    }

    timer.split('Ensure Company')
    const company = await Company.query().ensure(data.Subcontractor || data['Partner Name'])
    const ccsCompany = await Company.query().ensure('CCS')

    timer.split('Work Group Datas')
    const employeeId = data['Tech ID']
    const techTeamId = data['Tech Team']
    const getWorkGroupDatas = scopeCompany => [
      ...(employeeId && [
        {
          scopeCompanyId: scopeCompany.id,
          companyId: w2Company.id,
          type: 'Tech',
          externalId: employeeId,
          name: data['Tech Name'],
        },
      ]),
      ...(techTeamId && [
        {
          scopeCompanyId: scopeCompany.id,
          companyId: w2Company.id,
          type: 'Team',
          externalId: techTeamId,
          name: data['Tech Supervisor'],
        },
      ]),
      {
        scopeCompanyId: scopeCompany.id,
        companyId: w2Company.id,
        type: 'Company',
        externalId: w2Company.name,
        name: w2Company.name,
      },
      {
        scopeCompanyId: scopeCompany.id,
        companyId: w2Company.id,
        type: 'Company',
        externalId: company.name,
        name: company.name,
      },
      ...(!!data['Service Region'] && [
        {
          scopeCompanyId: scopeCompany.id,
          companyId: w2Company.id,
          type: 'Service Region',
          externalId: data['Service Region'],
          name: data['Service Region'],
        },
        {
          scopeCompanyId: scopeCompany.id,
          companyId: w2Company.id,
          type: 'Office',
          externalId: data.Office,
          name: data.Office,
        },
        {
          scopeCompanyId: scopeCompany.id,
          companyId: w2Company.id,
          type: 'DMA',
          externalId: data.DMA,
          name: data.DMA,
        },
        {
          scopeCompanyId: scopeCompany.id,
          companyId: w2Company.id,
          type: 'Division',
          externalId: data.Division,
          name: data.Division,
        },
      ]),
    ]

    const w2WorkGroupDatas = getWorkGroupDatas(ccsCompany).concat(getWorkGroupDatas(w2Company))
    const subWorkGroupDatas = w2Company.id === company.id ? [] : getWorkGroupDatas(company)
    const workGroupDatas = w2WorkGroupDatas.concat(subWorkGroupDatas)

    timer.split('Work Groups _.differenceWith')
    const workGroupPrimaryKey = ['scopeCompanyId', 'companyId', 'type', 'externalId']
    const hasSamePrimaryKey = (a, b) => _.isEqual(_.pick(a, workGroupPrimaryKey), _.pick(b, workGroupPrimaryKey))
    const newWorkGroupDatas = _.differenceWith(workGroupDatas, workOrder.workGroups, hasSamePrimaryKey)
    const obsoleteWorkGroups = _.differenceWith(workOrder.workGroups, workGroupDatas, hasSamePrimaryKey)

    timer.split('Ensure New Work Groups')
    const newWorkGroups = await Promise.mapSeries(newWorkGroupDatas, workGroupData => {
      return WorkGroup.query().ensure(workGroupData, workGroupCache)
    })

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
}
