import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import { GraphQLString } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'

export default class Timecard extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.uuid('employeeId')
    table.date('date').notNullable()
    table.timestamp('clockedInAt')
    table.timestamp('clockedOutAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('employeeId').references('Employee.id')
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

  static visible = ['id', 'date', 'clockedInAt', 'clockedOutAt', 'employee']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        //  this.whereRaw('FALSE')
      }
      _mine() {
        const { session } = this.context()
        if (!session) return this.whereRaw('FALSE')
        this.where({ employeeId: session.account.employee.id })
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
    }
  }

  static get mutations() {
    return {
      create: {
        description: 'create a timecard',
        type: this.GraphqlTypes.Timecard,
        args: {},
        resolve: async (root, args, context) => {
          const { session, moment } = context
          if (!session) throw new ExpectedError('Unauthorized Access')
          const existingTimecard = await Timecard.query()
          .mergeContext(context)
          ._mine()
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

          await timecard.$relatedQuery('employee').relate(session.account.employee)
          return timecard
        },
      },
      clockOut: {
        description: 'clock out a timecard',
        type: this.GraphqlTypes.Timecard,
        args: {},
        resolve: async (root, args, context) => {
          const { moment } = context
          const timecard = await Timecard.query()
          .mergeContext(context)
          ._mine()
          .whereNull('clockedOutAt')
          .first()
          if (!timecard) throw new ExpectedError('Unable to find your timecard. Please try again.')
          await timecard.$query().patch({ clockedOutAt: moment().format() })
          return timecard
        },
      },
    }
  }
}
