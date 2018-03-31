import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Report extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt')
    table.uuid('companyId').notNullable()
    table.uuid('creatorId')
    table.string('name').notNullable()
    table.boolean('isTemplate').defaultTo(false).notNullable()
    table.timestamp('completedAt')
    table.index(['isTemplate', 'name'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('creatorId').references('Account.id')
    table.foreign('companyId').references('Company.id')
  `
  static knexCreateJoinTables = {
    reportQuestions: `
      table.uuid('reportId').notNullable()
      table.uuid('questionId').notNullable()
      table.primary(['reportId', 'questionId'])
      table.unique(['questionId', 'reportId'])
      table.foreign('reportId').references('Report.id')
      table.foreign('questionId').references('Question.id')
    `,
  }
  static jsonSchema = {
    title: 'Report',
    description: 'An template for a form',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      isTemplate: { type: 'boolean' },
      completedAt: { type: ['string', 'null'], format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'name', 'isTemplate', 'createdAt', 'completedAt', 'questions', 'creator']

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
        relation: Model.ManyToManyRelation,
        modelClass: 'Question',
        join: {
          from: 'Report.id',
          through: {
            from: 'reportQuestions.reportId',
            to: 'reportQuestions.questionId',
          },
          to: 'Question.id',
        },
        modify: qb => {
          qb.orderBy('Question.order')
        },
      },
    }
  }
}
