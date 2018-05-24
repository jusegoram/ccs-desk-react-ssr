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
    const startOfDataImportsOnQueryDate = moment
    .tz(req.query.date, 'YYYY-MM-DD', 'America/Chicago')
    .startOf('day')
    .add(5, 'hours')
    .format()
    const visibleWorkGroupIds = knex('WorkGroup')
    .select('id')
    .where('companyId', session.account.company.id)
    const visibleAppointmentIds = knex('workGroupAppointments')
    .select('appointmentId')
    .whereIn('workGroupId', visibleWorkGroupIds)
    const scope = knex('Appointment')
    .distinct('workOrderId')
    .whereIn('id', visibleAppointmentIds)
    .whereRaw("lifespan && tstzrange(?, ?, '[)')", [startOfDataImportsOnQueryDate, endOfQueryDate])
    .where('dueDate', req.query.date)

    const rawWorkOrderStats = await knex('Appointment')
    .with('most_recent', qb => {
      qb
      .select('workOrderId', knex.raw('MAX("createdAt") as "createdAt"'))
      .from('Appointment')
      .whereIn('workOrderId', scope)
      .where('createdAt', '<=', endOfQueryDate)
      .groupBy('workOrderId')
    })
    .innerJoin('most_recent', function() {
      this.on('Appointment.workOrderId', '=', 'most_recent.workOrderId').on(
        'Appointment.createdAt',
        '=',
        'most_recent.createdAt'
      )
    })
    .select('row', 'type', 'status', 'dueDate')
    .then(_.identity)
    .filter(appointment => {
      const { row, status } = appointment
      if (status !== 'Cancelled') return true
      const dueDate = appointment.dueDate && moment(appointment.dueDate).startOf('day')
      if (!dueDate || !dueDate.isValid()) return true
      const cancelledDate = moment(row['Cancelled Date'], 'YYYY-MM-DD HH:mm:ss').startOf('day')
      if (!cancelledDate.isValid()) return true
      const cancelledInThePast = cancelledDate.isBefore(dueDate)
      return !cancelledInThePast
    })
    .map(appointment => {
      let { status } = appointment
      const dueDate = appointment.dueDate && moment(appointment.dueDate)
      const dueInTheFuture = dueDate.isAfter(endOfQueryDate)
      if (dueInTheFuture) status = 'Rescheduled'
      return {
        ...appointment,
        status,
      }
    })
    .then(results => {
      const resultMap = {}
      results.forEach(result => {
        const { row, type, status } = result
        const key = row.Source + '#' + type + '#' + status
        resultMap[key] = resultMap[key] || {
          source: row.Source,
          type,
          status,
          count: 0,
        }
        resultMap[key].count += 1
      })
      const resultCounts = _.values(resultMap)
      return _.sortBy(resultCounts, ['source', 'type', 'status'])
    })
    .map(data => ({
      ...data,
      name: data.status,
      value: data.count,
      hex: statusColors[data.status],
    }))
    const siebel = _.filter(rawWorkOrderStats, { source: 'Siebel' })
    const siebelByType = _.sortBy(
      _.values(
        _.mapValues(_.groupBy(siebel, 'type'), (group, groupName) => ({
          name: groupName,
          label: groupName,
          hex: colors[groupName],
          children: group,
          value: _.sumBy(group, 'value'),
        }))
      ),
      'name'
    )
    const edge = _.difference(rawWorkOrderStats, siebel)
    const edgeByType = _.sortBy(
      _.values(
        _.mapValues(_.groupBy(edge, 'type'), (group, groupName) => ({
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
        value: _.sumBy(siebelByType, 'value'),
        children: siebelByType,
      },
      {
        name: 'Edge',
        label: 'Edge',
        hex: '#F89570',
        value: _.sumBy(edgeByType, 'value'),
        children: edgeByType,
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
