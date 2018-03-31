import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Question extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.integer('order').defaultTo(0).notNullable()
    table.text('question').notNullable()
    table.string('answerType').notNullable()
    table.text('answer')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static jsonSchema = {
    title: 'Question',
    description: 'An template for a form',
    type: 'object',

    properties: {
      id: { type: 'string' },
      order: { type: 'number' },
      question: { type: 'string' },
      answerType: { type: 'string' },
      answer: { type: ['string', 'null'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  }

  static visible = ['id', 'order', 'question', 'answerType', 'answer']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        this.whereRaw('FALSE')
      }
    }
  }
}
