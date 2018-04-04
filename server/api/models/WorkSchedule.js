import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import _ from 'lodash'

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
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (!session) return this.whereRaw('FALSE')
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
          from: 'WorkSchedule.employeeId',
          to: 'Employee.id',
        },
      },
    }
  }
}
