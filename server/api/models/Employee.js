import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Employee extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.uuid('companyId').notNullable()
    table.string('externalId').notNullable()
    table.string('role').defaultTo('Tech').notNullable() // 'Tech', 'Manager'
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
      role: { type: 'string' },
      externalId: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      terminatedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = [
    'id',
    'name',
    'role',
    'externalId',
    'phoneNumber',
    'email',
    'timecard',
    'vehicleClaim',
    'timecards',
    'vehicleClaims',
    'company',
  ]

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (!session) return this.whereRaw('FALSE')
        if (session.account.employee && session.account.employee.role === 'tech')
          this.where({ id: session.account.employee.id })
        return this
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
      workGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Employee.id',
          through: {
            from: 'workGroupTechs.techId',
            to: 'workGroupTechs.workGroupId',
          },
          to: 'WorkGroup.id',
        },
      },
      managedWorkGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Employee.id',
          through: {
            from: 'workGroupManagers.managerId',
            to: 'workGroupManagers.workGroupId',
          },
          to: 'WorkGroup.id',
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
      timecard: {
        relation: Model.HasOneRelation,
        modelClass: 'Timecard',
        join: {
          from: 'Employee.id',
          to: 'Timecard.employeeId',
        },
        modify: qb => {
          qb.whereNull('Timecard.clockedOutAt')
        },
      },
      vehicleClaim: {
        relation: Model.HasOneRelation,
        modelClass: 'VehicleClaim',
        join: {
          from: 'Employee.id',
          to: 'VehicleClaim.employeeId',
        },
        modify: qb => {
          qb.whereNull('VehicleClaim.returnedAt')
        },
      },
      timecards: {
        relation: Model.HasManyRelation,
        modelClass: 'Timecard',
        join: {
          from: 'Employee.id',
          to: 'Timecard.employeeId',
        },
      },
      vehicleClaims: {
        relation: Model.HasManyRelation,
        modelClass: 'VehicleClaim',
        join: {
          from: 'Employee.id',
          to: 'VehicleClaim.employeeId',
        },
      },
    }
  }
}
