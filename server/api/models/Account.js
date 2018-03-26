import { withDeletedAt, withPassword } from 'server/api/util/mixins'
import { compose } from 'server/api/util'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import { GraphQLString } from 'graphql'
import jwt from 'jsonwebtoken'

export default class Account extends compose(withDeletedAt, withPassword({ allowEmptyPassword: true }))(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.string('name').notNullable()
    table.string('email').notNullable()
    table.string('password').notNullable()
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `

  static jsonSchema = {
    title: 'Account',
    description: "A person's account with our system",
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      password: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'name', 'email']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {
      sessions: {
        relation: Model.HasManyRelation,
        modelClass: 'Session',
        join: {
          from: 'Account.id',
          to: 'Session.accountId',
        },
      },
    }
  }

  static get mutations() {
    return {
      login: {
        description: 'login to a session',
        type: this.GraphqlTypes.Session,
        args: {
          email: { type: GraphQLString },
          password: { type: GraphQLString },
        },
        resolve: async (root, { email, password }, { res }) => {
          const account = await Account.query()
          .where({ email })
          .first()
          if (!await account.verifyPassword(password)) return null
          const session = await account
          .$relatedQuery('sessions')
          .insert({})
          .returning('*')
          const tokenPayload = { sessionId: session.id }
          const expiresIn = 2 * 60 * 60 // 2 hours in seconds
          const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn })
          res.cookie('token', token)
          return session
        },
      },
    }
  }
}
