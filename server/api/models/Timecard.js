import { withDeletedAt } from 'server/api/util/mixins'
import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model, transaction } from 'objection'
import { GraphQLFloat } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'

export default class Timecard extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.uuid('employeeId')
    table.date('date').notNullable()
    table.timestamp('clockedInAt')
    table.timestamp('clockedOutAt')
    table.uuid('clockInLocationId')
    table.uuid('clockOutLocationId')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('employeeId').references('Employee.id')
    table.foreign('clockInLocationId').references('Geography.id')
    table.foreign('clockOutLocationId').references('Geography.id')
  `
  static jsonSchema = {
    title: 'Timecard',
    description: "An employee's timecard",
    type: 'object',

    properties: {
      id: { type: 'string' },
      date: { type: ['string', 'null'], format: 'date' },
      clockedInAt: { type: ['string', 'null'], format: 'date-time' },
      clockedOutAt: { type: ['string', 'null'], format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'date', 'clockedInAt', 'clockedOutAt', 'employee', 'clockInLocation', 'clockOutLocation']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (!session) return this.whereRaw('FALSE')
        if (session.account.employee) this.where({ employeeId: session.account.employee.id })
        return this
      }
    }
  }

  static get relationMappings() {
    return {
      employee: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Employee',
        join: {
          from: 'Timecard.employeeId',
          to: 'Employee.id',
        },
      },
      vehicle: {
        relation: Model.HasOneRelation,
        modelClass: 'Vehicle',
        join: {
          from: 'Timecard.vehicleId',
          to: 'Vehicle.id',
        },
      },
      clockedInReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'Timecard.clockedInReportId',
          to: 'Report.id',
        },
      },
      clockedOutReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'Timecard.clockedOutReportId',
          to: 'Report.id',
        },
      },
      clockInLocation: {
        relation: Model.HasOneRelation,
        modelClass: 'Geography',
        join: {
          from: 'Timecard.clockInLocationId',
          to: 'Geography.id',
        },
      },
      clockOutLocation: {
        relation: Model.HasOneRelation,
        modelClass: 'Geography',
        join: {
          from: 'Timecard.clockOutLocationId',
          to: 'Geography.id',
        },
      },
    }
  }

  static get mutations() {
    return {
      create: {
        description: 'create a timecard',
        type: this.GraphqlTypes.Timecard,
        args: {
          latitude: { type: GraphQLFloat },
          longitude: { type: GraphQLFloat },
        },
        resolve: async (root, { latitude, longitude }, context) => {
          const { session, moment } = context
          if (!session) throw new ExpectedError('Unauthorized Access')
          const Geography = require('./Geography').default
          return await transaction(Timecard, Geography, async (Timecard, Geography) => {
            const existingTimecard = await Timecard.query()
            .mergeContext(context)
            .whereNull('clockedOutAt')
            .first()
            if (existingTimecard) throw new ExpectedError('You already have a timecard. Clock out to create a new one.')
            const timecard = await Timecard.query()
            .mergeContext(context)
            .insert({
              date: moment().format('YYYY-MM-DD'),
              clockedInAt: moment().format(),
            })
            .returning('*')

            const location = await Geography.query()
            .insert({ type: 'location', latitude, longitude })
            .returning('*')
            await Timecard.query()
            .patch({ clockInLocationId: location.id })
            .where({ id: timecard.id })
            await timecard.$relatedQuery('employee').relate(session.account.employee)
            return timecard
          })
        },
      },
      clockOut: {
        description: 'clock out a timecard',
        type: this.GraphqlTypes.Timecard,
        args: {
          latitude: { type: GraphQLFloat },
          longitude: { type: GraphQLFloat },
        },
        resolve: async (root, { latitude, longitude }, context) => {
          const { moment } = context
          const Geography = require('./Geography').default
          return await transaction(Timecard, Geography, async (Timecard, Geography) => {
            const timecard = await Timecard.query()
            .mergeContext(context)
            .whereNull('clockedOutAt')
            .first()
            if (!timecard) throw new ExpectedError('Unable to find your timecard. Please try again.')
            const location = await Geography.query()
            .insert({ type: 'location', latitude, longitude })
            .returning('*')
            await Timecard.query()
            .patch({ clockOutLocationId: location.id })
            .where({ id: timecard.id })
            await timecard.$query().patch({ clockedOutAt: moment().format() })
            return timecard
          })
        },
      },
    }
  }
}
