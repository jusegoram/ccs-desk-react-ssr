import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import { GraphQLString, GraphQLNonNull } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'
import _ from 'lodash'
import sendEmail from 'server/util/sendEmail'
import inviteEmail from 'server/emails/invite'

export default class Invite extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('email').notNullable()
    table.string('name').notNullable().defaultTo('Unsent')
    table.string('status').notNullable().defaultTo('Unsent')
    table.string('role').notNullable().defaultTo('Supervisor')
    table.uuid('token').defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('senderId').notNullable().index()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('senderId').references('Account.id')
  `

  static jsonSchema = {
    title: 'Invite',
    description: 'An invitation for a new user to join the system',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      email: { type: 'string' },
      name: { type: 'string' },
      status: { type: 'string' },
      role: { type: 'string' },
      token: { type: ['string', 'null'] },
      // </custom>
      createdAt: { type: 'string', format: 'date-time' },
    },
  }

  static visible = ['id', 'status', 'email', 'name', 'createdAt']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      // _contextFilter() {
      //   const { session } = this.context()
      //   if (session === undefined) return
      //   if (session === null) return this.whereRaw('FALSE')
      //   this.where({ 'Invite.senderId': session.account.id })
      // }
    }
  }

  static get relationMappings() {
    return {
      sender: {
        relation: Model.HasOneRelation,
        modelClass: 'Account',
        join: {
          from: 'Invite.senderId',
          to: 'Account.id',
        },
      },
    }
  }
  static get mutations() {
    return {
      create: {
        description: 'create invite',
        type: this.GraphqlTypes.Invite,
        args: {
          email: { type: GraphQLString },
          name: { type: GraphQLString },
          role: { type: GraphQLString },
        },
        resolve: async (root, { email, name, role }, { session }) => {
          // Validate request
          if (!session) throw new ExpectedError('You are not allowed to do that')
          const Account = require('./Account').default
          const existingAccount = await Account.query().findOne({ email })
          if (existingAccount) throw new ExpectedError('That email address is taken')
          const senderId = session.account.id
          const invite = await Invite.query()
          .insert({ email, name, role, senderId })
          .returning('*')

          const html = inviteEmail({ invite, sender: session.account })
          const subject = `${session.account.name} invited you to CCS Desk`
          try {
            await sendEmail({ recipient: email, subject, html })
          } catch (e) {
            console.error(e) // eslint-disable-line no-console
            throw new ExpectedError(`Unable to send email to ${email}`)
          }
          return await invite
          .$query()
          .patch({ status: 'Sent' })
          .returning('*')
        },
      },
      accept: {
        description: 'accept invite',
        type: this.GraphqlTypes.Invite,
        args: {
          token: { type: GraphQLString },
          password: { type: GraphQLString },
          passwordConfirm: { type: GraphQLString },
          name: { type: GraphQLString },
        },
        resolve: async (root, { token, password, passwordConfirm, name }) => {
          // Validate request
          const Account = require('./Account').default
          const invite = await Invite.query()
          .eager('sender')
          .where({ token: token })
          .first()
          const companyId = invite.sender.companyId
          if (!invite) throw new ExpectedError('Your invitation is no longer valid')
          if (password !== passwordConfirm) throw new ExpectedError('Password does not match password confirmation')
          await Account.query().insert({
            email: invite.email,
            name,
            companyId,
            password,
          })
          await invite.$query().patch({ status: 'Accepted', token: null })
          return invite
        },
      },
    }
  }
}
