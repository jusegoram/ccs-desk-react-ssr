import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class FormTemplate extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('name').notNullable()
    table.jsonb('questions').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static jsonSchema = {
    title: 'FormTemplate',
    description: 'An template for a form',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: ['string', 'null'] },
            type: { type: ['string', 'null'] },
            section: { type: ['string', 'null'] },
          },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  }

  static visible = ['id', 'name', 'questions']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        // this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {}
  }
}
