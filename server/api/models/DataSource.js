import APIModel from 'server/api/util/APIModel'
import { QueryBuilder } from 'objection'

export default class DataSource extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('service')
    table.string('name')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.unique(['service', 'name'])
  `
  static jsonSchema = {
    title: 'Data Source',
    description: 'A source of data used to import information into the system',
    type: 'object',

    properties: {
      id: { type: 'string' },
      service: { type: 'string' },
      name: { type: 'string' },
    },
  }

  static visible = ['id', 'name', 'service']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {}
  }
}
