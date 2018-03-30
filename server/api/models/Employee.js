import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import moment from 'moment'

export default class Employee extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.uuid('companyId').notNullable()
    table.string('externalId').notNullable()
    table.string('name')
    table.string('phoneNumber')
    table.string('email')
    table.uuid('dataSourceId')
    table.unique(['companyId', 'externalId'])
    table.unique(['externalId', 'companyId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('companyId').references('Company.id')
  `
  static jsonSchema = {
    title: 'Employee',
    description: 'An employee',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      externalId: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      terminatedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'name', 'externalId', 'phoneNumber', 'email', 'currentTimecard', 'currentVehicleClaim']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        // this.whereRaw('FALSE')
      }
      _mine() {
        const { session } = this.context()
        this.where({ id: session.account.employee.id })
      }
    }
  }

  static get relationMappings() {
    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'Employee.companyId',
          to: 'Company.id',
        },
      },
      account: {
        relation: Model.HasOneRelation,
        modelClass: 'Account',
        join: {
          from: 'Employee.id',
          to: 'Account.employeeId',
        },
      },
      currentTimecard: {
        relation: Model.HasOneRelation,
        modelClass: 'Timecard',
        join: {
          from: 'Employee.id',
          to: 'Timecard.employeeId',
        },
        modify: qb => {
          const { session } = qb.context()
          qb.where({ date: moment.utc().toDate() })
        },
      },
      currentVehicleClaim: {
        relation: Model.HasOneRelation,
        modelClass: 'VehicleClaim',
        join: {
          from: 'Employee.id',
          to: 'VehicleClaim.employeeId',
        },
        modify: qb => {
          const { session } = qb.context()
          qb.whereNull('VehicleClaim.unclaimedAt')
        },
      },
    }
  }
}
