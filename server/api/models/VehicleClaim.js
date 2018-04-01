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
    table.uuid('claimLocationId')
    table.uuid('returnLocationId')
    table.uuid('claimReportId')
    table.uuid('returnReportId')
    table.timestamp('claimedAt')
    table.timestamp('returnedAt')
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('employeeId').references('Employee.id')
    table.foreign('vehicleId').references('Vehicle.id')
    table.foreign('claimReportId').references('Report.id')
    table.foreign('returnReportId').references('Report.id')
    table.foreign('claimLocationId').references('Geography.id')
    table.foreign('returnLocationId').references('Geography.id')
  `
  static jsonSchema = {
    title: 'Timecard',
    description: "An employee's timecard",
    type: 'object',

    properties: {
      id: { type: 'string' },
      date: { type: ['string', 'null'], format: 'date' },
      claimedAt: { type: ['string', 'null'], format: 'date-time' },
      returnedAt: { type: ['string', 'null'], format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'date', 'claimedAt', 'returnedAt', 'employee', 'vehicle', 'claimReport', 'returnReport']

  static get QueryBuilder() {
    return class extends QueryBuilder {
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
      claimReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'VehicleClaim.claimReportId',
          to: 'Report.id',
        },
      },
      returnReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'VehicleClaim.returnReportId',
          to: 'Report.id',
        },
      },
      claimLocation: {
        relation: Model.HasOneRelation,
        modelClass: 'Geography',
        join: {
          from: 'VehicleClaim.claimLocationId',
          to: 'Geography.id',
        },
      },
      returnLocation: {
        relation: Model.HasOneRelation,
        modelClass: 'Geography',
        join: {
          from: 'VehicleClaim.returnLocationId',
          to: 'Geography.id',
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
          latitude: { type: GraphQLString },
          longitude: { type: GraphQLString },
        },
        resolve: async (root, { externalId, latitude, longitude }, context) => {
          const { session, moment } = context
          if (!session) throw new ExpectedError('Unauthorized Access')
          if (!latitude || !longitude)
            throw new ExpectedError('In order to claim a vehicle, you must specify your location')
          const Vehicle = require('./Vehicle').default
          const vehicle = await Vehicle.query()
          .mergeContext(context)
          .where({ externalId })
          .first()
          if (!vehicle) throw new ExpectedError('Unable to find a vehicle with that identifier')
          const existingVehicleClaim = await VehicleClaim.query()
          .mergeContext(context)
          .whereNull('returnedAt')
          .first()
          if (existingVehicleClaim)
            throw new ExpectedError(
              'You already have a claim on a vehicle. Return that vehicle before claiming a new one.'
            )
          const vehicleClaim = await VehicleClaim.query()
          .insert({
            date: moment().format('YYYY-MM-DD'),
            claimedAt: moment().format(),
          })
          .returning('*')
          await vehicleClaim.$relatedQuery('claimLocation').insert({ latitude, longitude })
          await vehicleClaim.$relatedQuery('employee').relate(session.account.employee)
          await vehicleClaim.$relatedQuery('vehicle').relate(vehicle)
          return vehicleClaim
        },
      },
      return: {
        description: 'return a vehicle claim',
        type: this.GraphqlTypes.VehicleClaim,
        args: {
          latitude: { type: GraphQLString },
          longitude: { type: GraphQLString },
        },
        resolve: async (root, { latitude, longitude }, context) => {
          const { moment } = context
          if (!latitude || !longitude)
            throw new ExpectedError('In order to return a vehicle, you must specify your location')
          const vehicleClaim = await VehicleClaim.query()
          .mergeContext(context)
          .whereNull('returnedAt')
          .first()
          if (!vehicleClaim) throw new ExpectedError('Unable to find your vehicle claim. Please try again.')
          await vehicleClaim.$relatedQuery('returnLocation').insert({ latitude, longitude })
          await vehicleClaim.$query().patch({ returnedAt: moment().format() })
          await vehicleClaim.$loadRelated('vehicle')
          return vehicleClaim
        },
      },
    }
  }
}
