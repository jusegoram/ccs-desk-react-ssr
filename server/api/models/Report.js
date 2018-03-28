import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Report extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt')
    table.uuid('creatorId')
    table.uuid('companyId').notNullable()
    table.string('name').notNullable()
    table.string('state').defaultTo('Draft').notNullable()
    table.timestamp('completedAt')
    table.index(['name', 'state'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('creatorId').references('Account.id')
    table.foreign('companyId').references('Company.id')
  `
  static jsonSchema = {
    title: 'Report',
    description: 'An template for a form',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      state: { type: 'string' },
      additionalComments: { type: ['string', 'null'] },
      completedAt: { type: ['string', 'null'], format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'name', 'state', 'createdAt', 'completedAt', 'questions', 'creator']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        // this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Account',
        join: {
          from: 'Report.creatorId',
          to: 'Account.id',
        },
      },
      questions: {
        relation: Model.HasManyRelation,
        modelClass: 'ReportQuestion',
        join: {
          from: 'Report.id',
          to: 'ReportQuestion.reportId',
        },
        modify: qb => {
          qb.orderBy('ReportQuestion.order')
        },
      },
    }
  }
}
