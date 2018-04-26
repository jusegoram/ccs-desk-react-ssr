import { graphqlExpress } from 'apollo-server-express'
// import getCreateContext from 'server/api/util/getCreateContext'
import { Model, raw } from 'objection'
import knex from 'server/knex'
import { builder as graphQlBuilder } from 'objection-graphql'
import * as models from 'server/api/models'
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import { GraphQLInt, GraphQLBoolean } from 'graphql'
import restRouter from 'server/api/restRouter'
import createToken from 'server/api/util/createToken'
import createClientMoment from 'server/api/util/createClientMoment'
import csv from 'csv'
import stream from 'stream'
import _ from 'lodash'
import stringify from 'csv-stringify'
import Promise from 'bluebird'

const { Readable } = stream

Model.knex(knex)

// initialize builder
const graphqlSchema = graphQlBuilder()
.selectFiltering(false)
.allModels(Object.values(models))
.extendWithModelMutations({ prefixWithClassName: true })
.argFactory((/*fields, modelClass*/) => {
  /* These Must Be Synchronous */
  const args = {
    limit: {
      type: GraphQLInt,
      query: (query, value) => {
        return query.limit(value)
      },
    },
    offset: {
      type: GraphQLInt,
      query: (query, value) => {
        return query.offset(value)
      },
    },
    mine: {
      type: GraphQLBoolean,
      query: (query, value) => {
        if (!value || !query._mine) return query
        return query._mine()
      },
    },
  }
  return args
})
.build()
export default async app => {
  // app.get('/download/vehicleClaims', async (req, res) => {
  //   const vehicleClaims = await models.VehicleClaim.query()
  //   .select()
  //   .eager('[employee vehicle]')
  //   const data = vehicleClaims.map(c => ({
  //     Name: c.employee.name,
  //     Date: moment(c.date).format('MM/DD/YYYY'),
  //     'Vechicle ID': c.vehicle.externalId,
  //     'Claimed At': !c.claimedAt ? '' : moment.tz(c.claimedAt, 'America/Chicago').format('h:mm A'),
  //     'Returned At': !c.returnedAt ? '' : moment.tz(c.returnedAt, 'America/Chicago').format('h:mm A'),
  //     'Duration (hours)': !(c.claimedAt && c.returnedAt)
  //       ? 'N/A'
  //       : moment(c.returnedAt)
  //       .diff(c.claimedAt, 'hours', true)
  //       .toFixed(1),
  //   }))
  //   const csv = await CSV.toCSV(data)
  //   const csvStream = new Readable()
  //   csvStream.push(csv)
  //   csvStream.push(null)
  //   res.writeHead(200, {
  //     'Content-Type': 'text/csv',
  //     'Access-Control-Allow-Origin': '*',
  //     'Content-Disposition': 'attachment; filename=VehicleClaims.csv',
  //   })
  //   csvStream.pipe(res)
  // })
  // app.get('/download/timecards', async (req, res) => {
  //   const timecards = await models.Timecard.query()
  //   .select()
  //   .eager('employee')
  //   const data = timecards.map(t => ({
  //     Name: t.employee.name,
  //     Date: moment(t.date).format('MM/DD/YYYY'),
  //     'Clock In': !t.clockedInAt ? '' : moment.tz(t.clockedInAt, 'America/Chicago').format('h:mm A'),
  //     'Clock Out': !t.clockedOutAt ? '' : moment.tz(t.clockedOutAt, 'America/Chicago').format('h:mm A'),
  //     'Duration (hours)': !(t.clockedInAt && t.clockedOutAt)
  //       ? 'N/A'
  //       : moment(t.clockedOutAt)
  //       .diff(t.clockedInAt, 'hours', true)
  //       .toFixed(1),
  //   }))
  //   const csv = await CSV.toCSV(data)
  //   const csvStream = new Readable()
  //   csvStream.push(csv)
  //   csvStream.push(null)
  //   res.writeHead(200, {
  //     'Content-Type': 'text/csv',
  //     'Access-Control-Allow-Origin': '*',
  //     'Content-Disposition': 'attachment; filename=Timecards.csv',
  //   })
  //   csvStream.pipe(res)
  // })
  app.get('/download/techs', async (req, res) => {
    try {
      const moment = require('moment-timezone')
      const { token } = req.query
      let session = null
      if (token) {
        const jwtPayload = jwt.verify(token, process.env.JWT_SECRET)
        const { sessionId } = jwtPayload
        session = await models.Session.query()
        .eager(models.Session.defaultEagerRelations)
        .findById(sessionId)

        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': 'attachment; filename=Techs.csv',
        })

        const stringifier = stringify({ header: true })
        await models.Employee.query()
        .mergeContext({ session, moment })
        ._contextFilter()
        .where({ role: 'Tech' })
        .map(async tech => _.mapValues(tech, val => (val === true ? 'TRUE' : val === false ? 'FALSE' : val)))
        .map(tech => {
          stringifier.write(tech.row)
        })
        stringifier.end()

        stringifier.pipe(res)
      } else {
        res.status(401).json({})
      }
    } catch (e) {
      console.error(e) // eslint-disable-line no-console
      res.status(401).json({})
    }
  })
  app.get('/download/work-orders', async (req, res) => {
    try {
      const timezone = req.query.timezone
      const moment = timezone && createClientMoment(timezone)
      const useCookieToken = true
      const cookieToken = req.headers.cookie && cookie.parse(req.headers.cookie).token
      const authHeaderToken = req.headers.authorization && req.headers.authorization.split(' ')[1]
      const token = useCookieToken ? cookieToken || authHeaderToken : authHeaderToken
      let session = null
      if (token) {
        const jwtPayload = jwt.verify(token, process.env.JWT_SECRET)
        const { sessionId } = jwtPayload
        session = await models.Session.query()
        .eager(models.Session.defaultEagerRelations)
        .findById(sessionId)
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
              'tstzrange("createdAt", lag("createdAt") over (partition by "workOrderId" order by "createdAt" desc), \'[)\') && tstzrange(?, ?, \'[)\') as livedtoday',
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
        .map(workOrder => {
          stringifier.write(workOrder.row)
        })
        stringifier.end()
        stringifier.pipe(res)
      } else {
        res.status(401).json({})
      }
    } catch (e) {
      console.error(e) // eslint-disable-line no-console
      res.status(401).json({})
    }
  })
  app.use('/api', restRouter)
  app.use(
    '/graphql',
    graphqlExpress(async (req, res) => {
      const timezone = req.headers.timezone
      res.cookie('timezone', timezone)
      const moment = createClientMoment(timezone)
      let session = null
      const clientContext = req.headers.clientcontext || 'Website'
      const clientVersion = req.headers.clientversion
      if (clientVersion && clientVersion !== '1.0.0') {
        return res.status(409).json({})
      }
      try {
        const useCookieToken = clientContext !== 'Mobile'
        const cookieToken = req.headers.cookie && cookie.parse(req.headers.cookie).token
        const authHeaderToken = req.headers.authorization && req.headers.authorization.split(' ')[1]
        const token = useCookieToken ? cookieToken || authHeaderToken : authHeaderToken
        if (token) {
          const jwtPayload = jwt.verify(token, process.env.JWT_SECRET)
          const { sessionId } = jwtPayload
          session = await models.Session.query()
          .eager(models.Session.defaultEagerRelations)
          .findById(sessionId)
          if (!session) {
            return res
            .cookie('token', '')
            .status(401)
            .json({})
          } else {
            const newToken = createToken({ sessionId, clientContext })
            res.cookie('token', newToken)
          }
        }
      } catch (e) {
        console.error(e) // eslint-disable-line no-console
      }
      if (req.headers.root === 'ASDF') session = undefined
      return {
        schema: graphqlSchema,
        context: { req, res, session, moment },
        rootValue: {
          async onQuery(builder) {
            await builder.mergeContext({ session, moment })._contextFilter()
          },
        },
        pretty: process.env.NODE_ENV === 'development',
      }
    })
  )
}
