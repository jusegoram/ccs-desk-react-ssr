import { withDeletedAt, withPassword } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import { GraphQLString, GraphQLList } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'

export default class Session extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.timestamp('expiresAt').defaultTo(knex.fn.now())
    table.uuid('accountId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('accountId').references('Account.id')
  `

  static jsonSchema = {
    title: 'Session',
    description: "A account's session",
    type: 'object',

    properties: {
      id: { type: 'string' },
      accountId: { type: 'string' },
      expiresAt: { type: 'string', format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'expiresAt', 'account']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
        this.where({ 'Session.id': session.id })
      }
    }
  }

  static get relationMappings() {
    return {
      account: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Account',
        join: {
          from: 'Session.accountId',
          to: 'Account.id',
        },
        filter: builder => {
          const { session } = builder.context()
          if (session === undefined) return
          if (session === null) return builder.whereRaw('FALSE')
          builder.where({ 'Account.id': session.account.id })
        },
      },
    }
  }

  static get mutations() {
    return {
      destroy: {
        description: 'destroy a session',
        type: this.GraphqlTypes.Session,
        args: {
          id: { type: GraphQLString },
        },
        resolve: async (root, { id }, { session }, info) => {
          if (session.id !== id) {
            throw new ExpectedError('You are not authorized to do that.')
          }
          await session.$query().delete()
          return null
        },
      },
    }
  }
}
