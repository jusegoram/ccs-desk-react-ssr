import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import { GraphQLString } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'

export default class VehicleClaim extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.date('date').notNullable()
    table.uuid('employeeId')
    table.uuid('vehicleId')
    table.uuid('startReportId')
    table.uuid('endReportId')
    table.timestamp('claimedAt')
    table.timestamp('unclaimedAt')
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('employeeId').references('Employee.id')
    table.foreign('vehicleId').references('Vehicle.id')
    table.foreign('startReportId').references('Report.id')
    table.foreign('endReportId').references('Report.id')
  `
  static jsonSchema = {
    title: 'Timecard',
    description: "An employee's timecard",
    type: 'object',

    properties: {
      id: { type: 'string' },
      date: { type: ['string', 'null'], format: 'date' },
      claimedAt: { type: ['string', 'null'], format: 'date-time' },
      unclaimedAt: { type: ['string', 'null'], format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'date', 'claimedAt', 'unclaimedAt', 'employee', 'vehicle', 'startReport', 'endReport']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        // this.whereRaw('FALSE')
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
          from: 'VehicleClaim.employeeId',
          to: 'Employee.id',
        },
      },
      vehicle: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Vehicle',
        join: {
          from: 'VehicleClaim.vehicleId',
          to: 'Vehicle.id',
        },
      },
      startReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'VehicleClaim.startReportId',
          to: 'Report.id',
        },
      },
      endReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'VehicleClaim.endReportId',
          to: 'Report.id',
        },
      },
    }
  }

  static get mutations() {
    return {
      create: {
        description: 'create a vehicle claim',
        type: this.GraphqlTypes.VehicleClaim,
        args: {
          externalId: { type: GraphQLString },
        },
        resolve: async (root, { externalId }, context) => {
          const { session, moment } = context
          if (!session) throw new ExpectedError('Unauthorized Access')
          const Vehicle = require('./Vehicle').default
          const vehicle = await Vehicle.query()
          .mergeContext(context)
          .where({ externalId })
          .first()
          if (!vehicle) throw new ExpectedError('Unable to find a vehicle with that identifier')
          const existingVehicleClaim = await VehicleClaim.query()
          .mergeContext(context)
          ._mine()
          .whereNull('unclaimedAt')
          .first()
          if (existingVehicleClaim)
            throw new ExpectedError(
              'You already have a claim on a vehicle. Unclaim that vehicle before claiming a new one.'
            )
          const vehicleClaim = await VehicleClaim.query()
          .insert({
            date: moment().format('YYYY-MM-DD'),
            claimedAt: moment().format(),
          })
          .returning('*')
          await vehicleClaim.$relatedQuery('employee').relate(session.account.employee)
          await vehicleClaim.$relatedQuery('vehicle').relate(vehicle)
          return vehicleClaim
        },
      },
      unclaim: {
        description: 'unclaim a vehicle claim',
        type: this.GraphqlTypes.VehicleClaim,
        args: {},
        resolve: async (root, args, context) => {
          const { moment } = context
          const vehicleClaim = await VehicleClaim.query()
          .mergeContext(context)
          ._mine()
          .whereNull('unclaimedAt')
          .first()
          if (!vehicleClaim) throw new ExpectedError('Unable to find your vehicle claim. Please try again.')
          await vehicleClaim.$query().patch({ unclaimedAt: moment().format() })
          return vehicleClaim
        },
      },
    }
  }
}
