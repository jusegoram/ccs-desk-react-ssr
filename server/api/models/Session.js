import { withDeletedAt } from 'server/api/util/mixins'
import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'
import { GraphQLString } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'
import createToken from 'server/api/util/createToken'

export default class Session extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.timestamp('expiresAt').defaultTo(knex.fn.now())
    table.uuid('rootAccountId')
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

  static visible = ['id', 'expiresAt', 'account', 'rootAccount']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        if (!session) return this
        this.where({ 'Session.id': session.id })
        return this
      }
    }
  }

  static defaultEagerRelations = '[rootAccount, account.[employee, company]]'
  static get relationMappings() {
    return {
      account: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Account',
        join: {
          from: 'Session.accountId',
          to: 'Account.id',
        },
      },
      rootAccount: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Account',
        join: {
          from: 'Session.rootAccountId',
          to: 'Account.id',
        },
      },
    }
  }

  static get mutations() {
    return {
      create: {
        description: 'create a session',
        type: this.GraphqlTypes.Session,
        args: {
          email: { type: GraphQLString },
          password: { type: GraphQLString },
        },
        resolve: async (root, { email, password }, { res, clientContext }) => {
          const Account = require('./Account').default
          const account = await Account.query()
          .where({ email })
          .first()
          if (!account || !await account.verifyPassword(password))
            throw new ExpectedError('Invalid email and/or password.')
          const session = await account
          .$relatedQuery('sessions')
          .insert({})
          .returning('*')
          if (account.root) {
            await session.$relatedQuery('rootAccount').relate(account)
          }
          const token = createToken({ sessionId: session.id, clientContext })
          session.token = token
          res.cookie('token', token)
          await session.$loadRelated(Session.defaultEagerRelations)
          return session
        },
      },
      mimic: {
        description: 'create a session that mimics an account',
        type: this.GraphqlTypes.Session,
        args: {
          accountId: { type: GraphQLString },
        },
        resolve: async (root, { accountId }, { session }) => {
          if (!session.rootAccount) throw new ExpectedError('You are not allowed to do that.')
          const Account = require('./Account').default
          const account = await Account.query()
          .where({ id: accountId })
          .first()
          await session.$relatedQuery('account').relate(account)
          await session.$loadRelated(Session.defaultEagerRelations)
          return session
        },
      },
    }
  }
}
