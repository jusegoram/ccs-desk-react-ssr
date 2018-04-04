import { withDeletedAt, withPassword } from 'server/api/util/mixins'
import { compose } from 'server/api/util'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Account extends compose(withDeletedAt, withPassword({ allowEmptyPassword: true }))(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    table.specificType('order', 'SERIAL')
    // <custom>
    table.string('name').notNullable()
    table.string('email').notNullable()
    table.string('password').notNullable()
    table.boolean('root').defaultTo(false).notNullable()
    table.uuid('employeeId')
    table.uuid('companyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('employeeId').references('Employee.id')
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

  static visible = ['id', 'name', 'email', 'token', 'root', 'employee', 'company']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
        if (!session.rootAccount) {
          this.where({ id: session.account.id })
        }
        this.orderByRaw('ABS(? - "Account".order)', session.account.order)
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
      permissions: {
        relation: Model.HasManyRelation,
        modelClass: 'Permission',
        join: {
          from: 'Account.id',
          to: 'Permission.accountId',
        },
      },
      employee: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Employee',
        join: {
          from: 'Account.employeeId',
          to: 'Employee.id',
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
}
