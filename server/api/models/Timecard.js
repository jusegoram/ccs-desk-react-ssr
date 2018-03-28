import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Timecard extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.timestamp('clockedInAt').notNullable()
    table.timestamp('clockedOutAt').notNullable()
    table.uuid('employeeId').notNullable()
    table.uuid('vehicleId')
    table.uuid('clockInReportId')
    table.uuid('clockOutReportId')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('employeeId').references('Employee.id')
    table.foreign('vehicleId').references('Vehicle.id')
    table.foreign('clockInReportId').references('Report.id')
    table.foreign('clockOutReportId').references('Report.id')
  `
  static jsonSchema = {
    title: 'Timecard',
    description: "An employee's timecard",
    type: 'object',

    properties: {
      id: { type: 'string' },
      clockedInAt: { type: ['string', 'null'], format: 'date-time' },
      clockedOutAt: { type: ['string', 'null'], format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'clockedInAt', 'clockedOutAt', 'employee', 'vehicle', 'clockInReport', 'clockOutReport']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        // this.whereRaw('FALSE')
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
      clockInReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'Timecard.clockInReportId',
          to: 'Report.id',
        },
      },
      clockOutReport: {
        relation: Model.HasOneRelation,
        modelClass: 'Report',
        join: {
          from: 'Timecard.clockOutReportId',
          to: 'Report.id',
        },
      },
    }
  }
}
