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

export default async ({ rows, models, w2Company }) => {
  const { WorkOrder, WorkGroup, Company, Appointment, Employee } = models
  const knex = WorkOrder.knex()
  const workGroupCache = {}

  const directv = await Company.query().findOne({ name: 'DirecTV' })

  await Promise.resolve(rows).mapSeries(async row => {
    if (row['Subcontractor'] === 'W2' || row['Subcontractor'] === row['Partner Name']) delete row['Subcontractor']
    let subcontractor = row['Subcontractor'] && (await Company.query().findOne({ name: row['Subcontractor'] }))
    if (row['Subcontractor'] && !subcontractor) {
      subcontractor = await Company.query()
      .insert({ name: row['Subcontractor'] })
      .returning('*')
    }

    let workOrder = await WorkOrder.query().findOne({ externalId: row['Activity ID'] })
    if (workOrder && !_.isEqual(workOrder.row, row)) return
    if (!workOrder)
      workOrder = await WorkOrder.query().insert({
        companyId: directv.id,
        externalId: row['Activity ID'],
        date: getDateString(row['Due Date']),
        type: row['Order Type'],
        status: row['Status'],
        row: row,
      })
    await knex('workGroupWorkOrders')
    .where({ workOrderId: workOrder.id })
    .delete()

    const createForCompany = async company => {
      const workGroupCreations = [
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'Company',
            externalId: w2Company.name,
            name: w2Company.name,
          },
          workGroupCache
        ),
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'Subcontractor',
            externalId: subcontractor && subcontractor.name,
            name: subcontractor && subcontractor.name,
          },
          workGroupCache
        ),
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'Division',
            externalId: row['Division'],
            name: row['Division'],
          },
          workGroupCache
        ),
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'DMA',
            externalId: row['DMA'],
            name: row['DMA'],
          },
          workGroupCache
        ),
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'Service Region',
            externalId: row['Service Region'],
            name: row['Service Region'],
          },
          workGroupCache
        ),
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'Office',
            externalId: row['Office'],
            name: row['Office'],
          },
          workGroupCache
        ),
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'Team',
            externalId: row['Tech Team'],
            name: row['Tech Supervisor'],
          },
          workGroupCache
        ),
        WorkGroup.query().ensure(
          {
            companyId: company.id,
            type: 'Tech',
            externalId: row['Tech ID'],
            name: row['Tech Name'],
          },
          workGroupCache
        ),
      ]
      const workGroups = _.filter(await Promise.all(workGroupCreations))
      await Promise.map(workGroups, workGroup =>
        knex('workGroupWorkOrders').insert({
          workGroupId: workGroup.id,
          workOrderId: workOrder.id,
        })
      )
    }
    if (subcontractor) await createForCompany(subcontractor)
    await createForCompany(w2Company)
  })
}
