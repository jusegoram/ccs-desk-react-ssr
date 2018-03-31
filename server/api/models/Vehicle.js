import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Vehicle extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('companyId').notNullable()
    table.string('externalId').notNullable()
    table.unique(['companyId', 'externalId'])
    table.unique(['externalId', 'companyId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('companyId').references('Company.id')
  `
  static knexCreateJoinTables = {
    vehicleReports: `
      table.uuid('vehicleId').notNullable()
      table.uuid('reportId').notNullable()
      table.primary(['vehicleId', 'reportId'])
      table.unique(['reportId', 'vehicleId'])
      table.foreign('vehicleId').references('Vehicle.id')
      table.foreign('reportId').references('Report.id')
    `,
  }

  static jsonSchema = {
    title: 'Vehicle',
    description: 'An employee',
    type: 'object',

    properties: {
      id: { type: 'string' },
      externalId: { type: 'string' },
    },
  }

  static visible = ['id', 'externalId']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (!session) return this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {
      reports: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Report',
        join: {
          from: 'Vehicle.id',
          through: {
            from: 'vehicleReports.vehicleId',
            to: 'vehicleReports.reportId',
          },
          to: 'Report.vehicleId',
        },
      },
      vehicle: {
        relation: Model.HasManyRelation,
        modelClass: 'VehicleClaim',
        join: {
          from: 'Vehicle.id',
          to: 'VehicleClaim.vehicleId',
        },
      },
    }
  }
}
