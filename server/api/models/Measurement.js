import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model, raw } from 'objection'

export default class Measurement extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    // <custom>
    table.uuid('workGroupId')
    table.date('date')
    table.string('name')
    table.float('value')
    table.unique(['workGroupId', 'date', 'name'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('workGroupId').references('WorkGroup.id')
  `
  static jsonSchema = {
    title: 'Measurement',
    description: 'A measurement of a work group',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      date: { type: 'string', format: 'date-time' },
      name: { type: 'string' },
      value: { type: 'number' },
      // </custom>
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  }

  static visible = ['id', 'date', 'name', 'value', 'workGroup']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
      }
      near({ lat, lng, radius }) {
        this.whereRaw('ST_Distance(ST_Point(?, ?)::geography, location::geography) < ?', [lng, lat, radius]).orderBy(
          raw('ST_Distance(ST_Point(?, ?)::geography, location::geography)', [lng, lat])
        )
      }
    }
  }

  static get relationMappings() {
    return {
      workGroup: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Measurement.workGroupId',
          to: 'WorkGroup.id',
        },
      },
    }
  }
}
