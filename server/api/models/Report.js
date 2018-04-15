import { withDeletedAt } from 'server/api/util/mixins'
import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'
import { GraphQLString } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'

export default class Report extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt')
    table.uuid('companyId').notNullable()
    table.uuid('creatorId')
    table.string('name').notNullable()
    table.uuid('templateId').index()
    table.timestamp('completedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('creatorId').references('Account.id')
    table.foreign('companyId').references('Company.id')
    table.foreign('templateId').references('Report.id')
  `
  static knexCreateJoinTables = {
    reportQuestions: `
      table.uuid('reportId').notNullable()
      table.uuid('questionId').notNullable()
      table.primary(['reportId', 'questionId'])
      table.unique('questionId')
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
      completedAt: { type: ['string', 'null'], format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'name', 'createdAt', 'completedAt', 'questions', 'creator', 'template']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        return super._contextFilter()
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
      template: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Report',
        join: {
          from: 'Report.templateId',
          to: 'Report.id',
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

  static get mutations() {
    return {
      create: {
        description: 'create a report',
        type: this.GraphqlTypes.Report,
        args: {
          templateName: { type: GraphQLString },
        },
        resolve: async (root, { templateName }, context) => {
          const { session } = context
          if (!session) throw new ExpectedError('Unauthorized Access')

          const template = await Report.query()
          .mergeContext(context)
          .eager('questions')
          .select('id', 'name', 'companyId')
          .where({ name: templateName })
          .whereNull('templateId')
          .orderBy('createdAt', 'desc')
          .first()
          if (!template)
            throw new ExpectedError(
              `Unable to find report template named "${templateName}". Please report this to your administrator.`
            )

          const report = await template.$clone()
          delete report.id
          report.questions.forEach(question => {
            delete question.id
          })

          const insertedReport = await Report.query()
          .mergeContext(context)
          .insertGraph(report)
          .returning('*')

          await insertedReport.$relatedQuery('creator').relate(session.account)
          await insertedReport.$relatedQuery('template').relate(template)

          return insertedReport
        },
      },
    }
  }
}
