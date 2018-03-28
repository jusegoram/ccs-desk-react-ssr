import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class ReportQuestion extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('reportId').notNullable()
    table.integer('order').defaultTo(0).notNullable()
    table.text('questionText').notNullable()
    table.string('answerType').notNullable()
    table.text('answerText')
    table.text('answerImageUri')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('reportId').references('Report.id')
  `
  static jsonSchema = {
    title: 'ReportQuestion',
    description: 'An template for a form',
    type: 'object',

    properties: {
      id: { type: 'string' },
      order: { type: 'number' },
      questionText: { type: 'string' },
      answerType: { type: 'string' },
      answerText: { type: ['string', 'null'] },
      answerImageUri: { type: ['string', 'null'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  }

  static visible = ['id', 'order', 'questionText', 'answerType', 'answerText', 'answerImageUri']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {
      report: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Report',
        join: {
          from: 'ReportQuestion.reportId',
          to: 'Report.id',
        },
      },
    }
  }
}
