import { Model } from 'objection'
import knex from 'server/knex'
import { WorkOrder } from 'server/api/models'
import _ from 'lodash'

import express from 'express'

Model.knex(knex)

const router = express.Router()

const colors = {
  Service: '#B3AD9E',
  Rollback: '#12939A',
  Upgrade: '#79C7E3',
  'Former Install': '#1A3177',
  'New Install': '#FF9833',
  'NC Rollback': '#EF5D28',
}
const statusColors = {
  'Customer Unscheduled': '#19CDD7',
  'On Site': '#DDB27C',
  Cancelled: '#88572C',
  Dispatched: '#FF991F',
  Scheduled: '#F15C17',
  Hold: '#223F9A',
  'Past Open': '#DA70BF',
  'Pending Closed': '#125C77',
  Closed: '#4DC19C',
  Unscheduled: '#776E57',
  Acknowledged: '#12939A',
  'En Route with ETA': '#17B8BE',
}

router.get('/meta', async (req, res) => {
  const { session, moment } = req
  if (!session) return res.sendStatus(401)
  try {
    const knex = WorkOrder.knex()
    const endOfQueryDate = moment(req.query.date, 'YYYY-MM-DD')
    .endOf('day')
    .format()
    const visibleWorkGroupIds = knex('WorkGroup')
    .select('id')
    .where('companyId', session.account.company.id)
    const visibleAppointmentIds = knex('workGroupAppointments')
    .select('appointmentId')
    .whereIn('workGroupId', visibleWorkGroupIds)
    const rawWorkOrderStats = await knex('Appointment')
    .with('most_recent', qb => {
      qb
      .select('workOrderId', knex.raw('MAX("createdAt") as "createdAt"'))
      .from('Appointment')
      .whereRaw('lifespan @> ?::timestamptz', [endOfQueryDate])
      .where('dueDate', req.query.date)
      .whereIn('id', visibleAppointmentIds)
      .groupBy('workOrderId')
    })
    .innerJoin('most_recent', function() {
      this.on('Appointment.workOrderId', '=', 'most_recent.workOrderId').on(
        'Appointment.createdAt',
        '=',
        'most_recent.createdAt'
      )
    })
    .select(
      knex.raw("row->>'Source' as source"),
      'type',
      knex.raw("(case when (upper(lifespan) is null) then status else 'Rescheduled' end) as status")
    )
    .count()
    .groupByRaw("row->>'Source', type, status, lifespan")
    .orderBy('type', 'status')
    .map(data => {
      data.count = parseInt(data.count)
      return data
    })
    .map(data => ({
      ...data,
      name: data.status,
      value: data.count,
      hex: statusColors[data.status],
    }))
    const repairs = _.filter(rawWorkOrderStats, { source: 'Siebel' })
    const repairsByType = _.sortBy(
      _.values(
        _.mapValues(_.groupBy(repairs, 'type'), (group, groupName) => ({
          name: groupName,
          label: groupName,
          hex: colors[groupName],
          children: group,
          value: _.sumBy(group, 'value'),
        }))
      ),
      'name'
    )
    const production = _.difference(rawWorkOrderStats, repairs)
    const productionByType = _.sortBy(
      _.values(
        _.mapValues(_.groupBy(production, 'type'), (group, groupName) => ({
          name: groupName,
          label: groupName,
          hex: colors[groupName],
          children: group,
          value: _.sumBy(group, 'value'),
        }))
      ),
      'name'
    )
    const topLevelGroups = [
      {
        name: 'Siebel',
        label: 'Siebel',
        hex: '#F6D18A',
        value: _.sumBy(repairsByType, 'value'),
        children: repairsByType,
      },
      {
        name: 'Edge',
        label: 'Edge',
        hex: '#F89570',
        value: _.sumBy(productionByType, 'value'),
        children: productionByType,
      },
    ]
    const workOrderStats = {
      name: 'Work Orders',
      value: _.sumBy(topLevelGroups, 'value'),
      children: topLevelGroups,
    }
    res.json(workOrderStats)
  } catch (e) {
    if (!res.headersSent) {
      res.sendStatus(422)
    }
    throw e
  }
})

export default router
