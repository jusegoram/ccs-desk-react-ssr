import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'
import _ from 'lodash'

export default class Employee extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.specificType('bit', 'SERIAL')
    table.timestamp('terminatedAt')
    table.uuid('companyId').notNullable()
    table.uuid('workGroupId')
    table.uuid('startLocationId')
    table.string('externalId').notNullable()
    table.string('alternateExternalId').index()
    table.string('timezone')
    table.string('role').defaultTo('Tech').notNullable() // 'Tech', 'Manager'
    table.string('name')
    table.string('phoneNumber')
    table.string('email')
    table.string('skills')
    table.string('schedule')
    table.json('row')
    table.uuid('dataSourceId')
    table.unique(['companyId', 'externalId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('companyId').references('Company.id')
    table.foreign('workGroupId').references('WorkGroup.id')
    table.foreign('startLocationId').references('Geography.id')
  `
  static knexCreateJoinTables = {
    workGroupEmployees: `
      table.uuid('workGroupId').notNullable()
      table.uuid('employeeId').notNullable()
      table.string('role').notNullable()
      table.primary(['role', 'workGroupId', 'employeeId'])
      table.unique(['role', 'employeeId', 'workGroupId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('employeeId').references('Employee.id')
    `,
  }
  static jsonSchema = {
    title: 'Employee',
    description: 'An employee',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
      externalId: { type: 'string' },
      alternateExternalId: { type: ['string', 'null'] },
      timezone: { type: ['string', 'null'] },
      phoneNumber: { type: ['string', 'null'] },
      email: { type: ['string', 'null'] },
      skills: { type: ['string', 'null'] },
      schedule: { type: ['string', 'null'] },
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
    'timezone',
    'email',
    'skills',
    'schedule',
    'timecard',
    'vehicleClaim',
    'timecards',
    'vehicleClaims',
    'company',
    'workGroups',
  ]

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        this.joinRelation('workGroups').where(function() {
          session.account.permissions.forEach(permission => {
            this.orWhereIn('workGroups.id', _.map(permission.workGroups, 'id'))
          })
        })
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
      workGroup: {
        relation: Model.HasOneRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Employee.workGroupId',
          to: 'WorkGroup.id',
        },
      },
      workGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Employee.id',
          through: {
            from: 'workGroupEmployees.employeeId',
            to: 'workGroupEmployees.workGroupId',
            beforeInsert(model) {
              model.role = 'Tech'
            },
            filter: { 'workGroupEmployees.role': 'Tech' },
          },
          to: 'WorkGroup.id',
        },
        modify: qb => {
          qb.orderBy('WorkGroup.order')
        },
      },
      managedWorkGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Employee.id',
          through: {
            from: 'workGroupEmployees.employeeId',
            to: 'workGroupEmployees.workGroupId',
            beforeInsert(model) {
              model.role = 'Manager'
            },
            filter: { 'workGroupEmployees.role': 'Manager' },
          },
          to: 'WorkGroup.id',
        },
        modify: qb => {
          qb.orderBy('WorkGroup.order')
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
      workSchedules: {
        relation: Model.HasManyRelation,
        modelClass: 'WorkSchedule',
        join: {
          from: 'Employee.id',
          to: 'WorkSchedule.employeeId',
        },
      },
      startLocation: {
        relation: Model.HasOneRelation,
        modelClass: 'Geography',
        join: {
          from: 'Employee.startLocationId',
          to: 'Geography.id',
        },
      },
      appointments: {
        relation: Model.HasManyRelation,
        modelClass: 'Appointment',
        join: {
          from: 'Employee.id',
          to: 'Appointment.employeeId',
        },
      },
    }
  }
}
