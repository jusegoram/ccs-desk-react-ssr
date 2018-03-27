import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import { GraphQLString, GraphQLList } from 'graphql'
import ExpectedError from 'server/errors/ExpectedError'
import _ from 'lodash'
import sendEmail from 'server/api/util/sendEmail'
import inviteEmail from 'server/emails/invite'

export default class Invite extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.string('role').notNullable()
    table.string('status').notNullable().defaultTo('Unsent')
    table.uuid('token').defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('senderId').notNullable()
    table.uuid('recipientId').notNullable()
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('senderId').references('Account.id')
    table.foreign('recipientId').references('Account.id')
  `

  static jsonSchema = {
    title: 'Invite',
    description: 'An invitation for a new user to join the system',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      role: { type: 'string' },
      status: { type: 'string' },
      token: { type: 'string' },
      // </custom>
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'status', 'role', 'sender', 'recipient']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
        this.where({ 'Invite.senderId': session.account.id })
      }
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
      recipient: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Account',
        join: {
          from: 'Invite.recipientId',
          to: 'Account.id',
        },
      },
    }
  }
  static get mutations() {
    return {
      // create: {
      //   description: 'create invite',
      //   type: this.GraphqlTypes.Invite,
      //   args: {
      //     recipient: { type: GraphQLString },
      //     recipientName: { type: GraphQLString },
      //     permissions: { type: new GraphQLList(this.GraphqlTypes.PermissionInput) },
      //   },
      //   resolve: async (root, { recipient, recipientName, permissions }, { session }) => {
      //     // Validate request
      //     if (!session) throw new ExpectedError("You aren't allowed to do that")
      //     permissions.forEach(permission => {
      //       let validPermission = false
      //       session.account.permissions.forEach(userPermission => {
      //         if (_.isMatch(permission, _.pickBy(_.pick(userPermission, 'companyId', 'officeId', 'teamId'))))
      //           validPermission = true
      //       })
      //       if (!validPermission)
      //         throw new ExpectedError(
      //           'You cannot create an account with more permissions than you have. ' +
      //             'Ensure that all provided permissions are at least as specific as one of yours.'
      //         )
      //     })
      //     // Create invite/account/permissions
      //     const { Account, Permission } = require('./index')
      //     const existingAccount = await Account.query()
      //     .where({ email: recipient })
      //     .pick(['id'])
      //     .first()
      //     if (existingAccount) await existingAccount.$loadRelated('owner')
      //     const invite = await Invite.query()
      //     .upsertGraph(
      //       {
      //         sender: { '#dbRef': session.account.id },
      //         recipient: {
      //           ...(existingAccount || {}),
      //           email: recipient,
      //           owner: {
      //             name: _.get(existingAccount, 'owner.name') || recipientName,
      //             role: 'user',
      //           },
      //         },
      //       },
      //       {
      //         relate: true,
      //       }
      //     )
      //     .returning('*')
      //     await invite.$loadRelated('[sender.owner, recipient.owner]')
      //     await Permission.query().upsertGraph(
      //       permissions.map(permission => ({
      //         ...permission,
      //         account: { '#dbRef': invite.recipient.id },
      //       }))
      //     )
      //     // Send invite email
      //     const subject = `${session.account.owner.name} has invited you to CCS Desk`
      //     const html = inviteEmail({ invite })
      //     sendEmail({ recipient, subject, html })
      //     // Mark invite as sent
      //     await invite
      //     .$query()
      //     .patch({ status: 'Sent' })
      //     .returning('*')
      //     console.log(invite)
      //     return invite
      //   },
      // },
      // accept: {
      //   description: 'accept invite',
      //   type: this.GraphqlTypes.Invite,
      //   args: {
      //     token: { type: GraphQLString },
      //     password: { type: GraphQLString },
      //   },
      //   resolve: async (root, { token, password }) => {
      //     // Validate request
      //     const invite = await Invite.query()
      //     .where({ token: token })
      //     .first()
      //     if (!invite) throw new ExpectedError('Your invitation is no longer valid')
      //     await invite.$loadRelated('recipient')
      //     await invite.recipient.$query().patch({ password: password })
      //     await invite.$query().patch({ status: 'Accepted', token: null })
      //     return invite
      //   },
      // },
    }
  }
}
