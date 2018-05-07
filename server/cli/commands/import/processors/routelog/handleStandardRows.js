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

export default async ({ rows, models, w2Company, dataSource, now }) => {
  const { WorkOrder, WorkGroup, Company, Appointment } = models
  const knex = WorkOrder.knex()
  const workGroupCache = {}

  const directv = await Company.query().findOne({ name: 'DirecTV' })

  const companyNames = _.without(_.map(_.uniqBy(rows, 'Subcontractor'), 'Subcontractor'), [w2Company.name, 'W2', ''])
  const subcontractors = _.keyBy(
    await Promise.map(companyNames, name => {
      if (name === 'W2' || name === w2Company.name || !name) return
      return Company.query().ensure(name)
    }),
    'name'
  )

  await Promise.resolve(rows).mapSeries(async row => {
    if (row['Activity ID'] !== '1-2WK1FAYV') return
    console.log(row)
    let workOrder = await WorkOrder.query().findOne({ companyId: directv.id, externalId: row['Activity ID'] })
    // if (workOrder && _.isEqual(workOrder.row, row)) return

    const subcontractorName =
      !row['Subcontractor'] || row['Subcontractor'] === w2Company.name ? null : row['Subcontractor']
    let subcontractor = subcontractors[subcontractorName]
    if (subcontractor) {
      const subworkgroup = await WorkGroup.query().ensure(
        {
          companyId: subcontractor.id,
          type: 'Subcontractor',
          externalId: subcontractor.name,
          name: subcontractor.name,
          createdAt: now,
          updatedAt: now,
        },
        workGroupCache
      )
      if (subworkgroup) {
        await subcontractor.$query().patch({ workGroupId: subworkgroup.id })
      }
      const companyDataSource = await subcontractor.$relatedQuery('dataSources').findOne({ id: dataSource.id })
      if (!companyDataSource) {
        await subcontractor.$relatedQuery('dataSources').relate(dataSource)
      }
    }

    if (!workOrder) {
      workOrder = await WorkOrder.query().insert({
        companyId: directv.id,
        externalId: row['Activity ID'],
        date: getDateString(row['Due Date']),
        type: row['Order Type'],
        status: row['Status'],
        row: row,
        createdAt: now,
      })
    } else {
      await workOrder.$query().patch({
        date: getDateString(row['Due Date']),
        type: row['Order Type'],
        status: row['Status'],
        row: row,
      })
    }
    let appointment = await Appointment.query().findOne({
      workOrderId: workOrder.id,
      date: getDateString(row['Due Date']),
    })
    if (!appointment) {
      appointment = await Appointment.query().insert({
        workOrderId: workOrder.id,
        date: getDateString(row['Due Date']),
        status: row['Status'],
        row: row,
        createdAt: now,
      })
    } else {
      appointment.$query().patch({
        status: row['Status'],
        row: row,
      })
    }
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
