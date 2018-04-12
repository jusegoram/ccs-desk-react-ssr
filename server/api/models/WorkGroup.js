import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model, transaction } from 'objection'
import Promise from 'bluebird'
import _ from 'lodash'

export default class WorkGroup extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.uuid('companyId')
    table.integer('order').notNullable()
    table.string('type').notNullable() // 'Company', 'Office', 'Team', 'DMA', 'Service Region', 'Division'
    table.string('externalId').notNullable()
    table.string('name').notNullable()
    table.unique(['companyId', 'type', 'externalId'])
    table.uuid('geographyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('geographyId').references('Geography.id')
    table.foreign('companyId').references('Company.id')
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
    directv_sr_data: `
      table.string('Service Region').index()
      table.string('Office')
      table.string('DMA')
      table.string('Division')
      table.string('HSP')
    `,
  }
  static jsonSchema = {
    title: 'WorkGroup',
    description: 'A person or group of people that fulfills work orders',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      order: { type: 'number' },
      type: { type: 'string' },
      externalId: { type: ['string', 'null'] },
      name: { type: 'string' },
      // </custom>
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'company', 'order', 'type', 'name', 'phoneNumber', 'email', 'employees', 'managers']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
        this.orderBy('WorkGroup.order')
      }
    }
  }

  static get relationMappings() {
    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'WorkGroup.companyId',
          to: 'Company.id',
        },
      },
      managers: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Employee',
        modify: qb => qb.where({ 'workGroupEmployees.role': 'Manager' }),
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupEmployees.workGroupId',
            to: 'workGroupEmployees.employeeId',
            beforeInsert(model) {
              model.role = 'Manager'
            },
          },
          to: 'Employee.id',
        },
      },
      techs: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Employee',
        modify: qb => qb.where({ 'workGroupEmployees.role': 'Tech' }),
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupEmployees.workGroupId',
            to: 'workGroupEmployees.employeeId',
            beforeInsert(model) {
              model.role = 'Tech'
            },
          },
          to: 'Employee.id',
        },
      },
      employees: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Employee',
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupEmployees.workGroupId',
            to: 'workGroupEmployees.employeeId',
          },
          to: 'Employee.id',
        },
      },
    }
  }
}
