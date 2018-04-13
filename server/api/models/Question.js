import { APIModel, BaseQueryBuilder } from 'server/api/util'

export default class Question extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.integer('order').defaultTo(0).notNullable()
    table.text('text').notNullable()
    table.text('answer')
    table.string('answerType').notNullable()
    table.string('section').notNullable()
  `
  static jsonSchema = {
    title: 'Question',
    description: 'An template for a form',
    type: 'object',

    properties: {
      id: { type: 'string' },
      order: { type: 'number' },
      text: { type: 'string' },
      section: { type: 'string' },
      answerType: { type: 'string' },
      answer: { type: ['string', 'null'] },
    },
  }

  static visible = ['id', 'order', 'text', 'section', 'answerType', 'answer']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        this.whereRaw('FALSE')
      }
    }
  }
}
