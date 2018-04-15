import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'

export default class WorkSchedule extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('employeeId').notNullable()
    table.string('day').notNullable()
    table.time('start').notNullable()
    table.time('end').notNullable()
    table.unique(['employeeId', 'day'])
    table.index(['start', 'end'])
  `
  static knexAlterTable = `
    table.foreign('employeeId').references('Employee.id')
  `
  static jsonSchema = {
    title: 'WorkSchedule',
    description: 'An employee',
    type: 'object',

    properties: {
      id: { type: 'string' },
      day: { type: 'string' },
      start: { type: 'string', format: 'time' },
      end: { type: 'string', format: 'time' },
    },
  }

  static visible = ['id', 'employee', 'day', 'start', 'end']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        return super._contextFilter()
      }
    }
  }

  static get relationMappings() {
    return {
      employee: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Employee',
        join: {
          from: 'WorkSchedule.employeeId',
          to: 'Employee.id',
        },
      },
    }
  }
}
