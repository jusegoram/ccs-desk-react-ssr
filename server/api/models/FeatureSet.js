import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
import moment from 'moment'

export default class FeatureSet extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.uuid('companyId').notNullable()
    table.boolean('hasAddressBook').defaultTo(false).notNullable()
    table.boolean('hasTimecards').defaultTo(false).notNullable()
    table.boolean('hasVehicleClaims').defaultTo(false).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('companyId').references('Company.id')
  `
  static jsonSchema = {
    title: 'FeatureSet',
    description: 'The config of the app',
    type: 'object',

    properties: {
      id: { type: 'string' },
      hasAddressBook: { type: 'boolean' },
      hasTimecards: { type: 'boolean' },
      hasVehicleClaims: { type: 'boolean' },
    },
  }

  static visible = ['id', 'hasTimecards', 'hasAddressBook', 'hasVehicleClaims']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (!session) return this.whereRaw('FALSE')
        if (session.account.employee) this.where({ id: session.account.employee.id })
        return this
      }
    }
  }

  static get relationMappings() {
    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'FeatureSet.companyId',
          to: 'Company.id',
        },
      },
    }
  }
}
