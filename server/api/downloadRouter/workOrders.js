import { Model, raw } from 'objection'
import knex from 'server/knex'
import * as models from 'server/api/models'
import _ from 'lodash'
import stringify from 'csv-stringify'
import express from 'express'
import Tech from 'server/api/models/Tech'

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  if (!req.session) return res.sendStatus(401)

  const { session, moment } = req
  const { date } = req.query

  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': 'attachment; filename=WorkOrders.csv',
  })
  const stringifier = stringify({ header: true })
  const { Appointment } = models
  const knex = Appointment.knex()
  const endOfQueryDate = moment(date, 'YYYY-MM-DD')
  .endOf('day')
  .format()
  const visibleWorkGroupIds = knex('WorkGroup')
  .select('id')
  .where('companyId', session.account.company.id)
  const visibleAppointmentIds = knex('workGroupAppointments')
  .select('appointmentId')
  .whereIn('workGroupId', visibleWorkGroupIds)
  await knex('Appointment')
  .with('most_recent', qb => {
    qb
    .select('workOrderId', knex.raw('MAX("createdAt") as "createdAt"'))
    .from('Appointment')
    .whereIn('id', visibleAppointmentIds)
    .whereRaw('lifespan @> ?::timestamptz', [endOfQueryDate])
    .where('dueDate', date)
    .groupBy('workOrderId')
  })
  .innerJoin('most_recent', function() {
    this.on('Appointment.workOrderId', '=', 'most_recent.workOrderId').on(
      'Appointment.createdAt',
      '=',
      'most_recent.createdAt'
    )
  })
  .select('row', 'dueDate')
  .map(async appointment => {
    if (moment(appointment.dueDate).isAfter(moment(date))) appointment.row.Status = 'Rescheduled'
    appointment.row = _.mapValues(appointment.row, val => (val === true ? 'TRUE' : val === false ? 'FALSE' : val))
    return appointment
  })
  // .filter(appointment => {
  //   if (!appointment.row['Cancelled Date']) return true
  //   return !moment(appointment.row['Cancelled Date'].split(' ')[0], 'YYYY-MM-DD').isBefore(moment(date))
  // })
  .map(appointment => appointment.row)
  .then(rows => _.sortBy(_.sortBy(rows, 'Tech ID'), 'DMA'))
  .map(row => {
    stringifier.write(row)
  })
  stringifier.end()
  stringifier.pipe(res)
})

export default router
