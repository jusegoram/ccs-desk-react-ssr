import { Model, raw } from 'objection'
import knex from 'server/knex'
import * as models from 'server/api/models'
import _ from 'lodash'
import stringify from 'csv-stringify'
import express from 'express'

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  if (!req.session) return res.sendStatus(401)

  const { session, moment } = req

  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': 'attachment; filename=Techs.csv',
  })

  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': 'attachment; filename=WorkOrders.csv',
  })
  const stringifier = stringify({ header: true })
  const workOrderIdsScheduledTodayAtSomePointToday = models.Appointment.query()
  .with('livedtoday', qb => {
    qb.from('Appointment').select(
      'id',
      raw(
        'tstzrange("createdAt", lag("createdAt") over (partition by "workOrderId" order by "createdAt" desc), \'[)\')' +
            " && tstzrange(?, ?, '[)') as livedtoday",
        [
          moment()
          .startOf('day')
          .format(),
          moment()
          .add(1, 'day')
          .startOf('day')
          .format(),
        ]
      )
    )
  })
  .distinct('workOrderId')
  .leftJoin('livedtoday', 'livedtoday.id', 'Appointment.id')
  .where({ date: moment().format('YYYY-MM-DD') })
  .where({ livedtoday: true })

  await models.WorkOrder.query()
  .mergeContext({ session, moment })
  ._contextFilter()
  .eager('appointments')
  .whereIn('id', workOrderIdsScheduledTodayAtSomePointToday)
  .map(async workOrder => {
    if (!workOrder.appointments || workOrder.appointments.length < 2) {
      return workOrder
    }
    const sortedAppointments = _.sortBy(workOrder.appointments, 'createdAt')
    const currentAppointment = sortedAppointments.slice(-1)[0]
    if (currentAppointment.date !== moment().format('YYYY-MM-DD')) workOrder.row['Status'] = 'Rescheduled'
    return workOrder
  })
  .map(async workOrder => {
    workOrder.row = _.mapValues(workOrder.row, val => (val === true ? 'TRUE' : val === false ? 'FALSE' : val))
    return workOrder
  })
  .filter(workOrder => {
    if (!workOrder.row['Cancelled Date']) return true
    return !moment(workOrder.row['Cancelled Date'].split(' ')[0], 'YYYY-MM-DD').isBefore(moment(workOrder.date))
  })
  .map(workOrder => {
    stringifier.write(workOrder.row)
  })
  stringifier.end()
  stringifier.pipe(res)
})

export default router
