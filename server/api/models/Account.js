import { GraphQLString } from 'graphql'
import { Model, transaction } from 'objection'
import jwt from 'jsonwebtoken'

import { withDeletedAt, withPassword } from 'server/api/util/mixins'
import { compose, APIModel, BaseQueryBuilder } from 'server/api/util'
import passwordResetEmail from 'server/emails/passwordReset'
import ExpectedError from 'server/errors/ExpectedError'
import sendEmail from 'server/util/sendEmail'
import config from 'server/config'

export default class Account extends compose(withDeletedAt, withPassword({ allowEmptyPassword: true }))(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.specificType('order', 'SERIAL')
    // <custom>
    table.string('name').notNullable()
    table.string('email').notNullable().unique()
    table.string('password').notNullable()
    table.boolean('root').defaultTo(false).notNullable()
    table.uuid('companyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('companyId').references('Company.id')
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
      root: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'name', 'email', 'token', 'root', 'company']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        if (!session.rootAccount) {
          this.where({ id: session.account.id })
        }
        this.orderByRaw('ABS(? - "Account".order)', session.account.order)
        return this
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
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'Account.companyId',
          to: 'Company.id',
        },
      },
    }
  }

  static get mutations() {
    return {
      requestPasswordReset: {
        description: 'create a session',
        type: this.GraphqlTypes.Account,
        args: {
          email: { type: GraphQLString },
        },
        resolve: async (root, { email }) => {
          return transaction(Account, async Account => {
            const account = await Account.query().findOne({ email })
            if (!account) return null
            const resetToken = jwt.sign({ email, hash: account.password }, process.env.PASSWORD_RESET_JWT_SECRET, {
              expiresIn: 60 * 60 * 1000,
            })
            const html = passwordResetEmail({
              resetUrl: `${config.host}/reset-password?token=${encodeURIComponent(resetToken)}`,
            })
            await sendEmail({
              recipient: email,
              subject: 'Reset Your CCS Desk Password',
              html: html,
            })
            return null
          })
        },
      },
      resetPassword: {
        description: 'create a session',
        type: this.GraphqlTypes.Account,
        args: {
          password: { type: GraphQLString },
          token: { type: GraphQLString },
        },
        resolve: async (root, { password, token }) => {
          return transaction(Account, async Account => {
            let payload = null
            try {
              payload = jwt.verify(token, process.env.PASSWORD_RESET_JWT_SECRET)
            } catch (e) {
              throw new ExpectedError('Invalid password reset token')
            }
            const { email, hash } = payload
            const account = await Account.query().findOne({ email })
            if (!account) {
              throw new ExpectedError('Unable to find the account for this reset token')
            }
            if (account.password !== hash) throw new ExpectedError('This reset token has already been used')
            await account.$query().patch({ password })
            return null
          })
        },
      },
    }
  }
}
