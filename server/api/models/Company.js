import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'
import { identity } from 'lodash'

const companies = {}

export default class Company extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('name').unique()
    table.uuid('workGroupId')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('workGroupId').references('WorkGroup.id')
  `

  static jsonSchema = {
    title: 'Company',
    description: 'A company',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    },
  }

  static visible = ['id', 'name']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        return super._contextFilter()
      }
      async ensure(name, { onInsert = identity } = {}) {
        if (companies[name]) return companies[name]
        companies[name] = await this.clone()
        .where({ name })
        .first()
        if (companies[name]) return companies[name]
        companies[name] = await this.insert({ name }).returning('*')
        await onInsert(companies[name])
        return companies[name]
      }
    }
  }

  static get relationMappings() {
    return {
      techs: {
        relation: Model.HasManyRelation,
        modelClass: 'Tech',
        join: {
          from: 'Company.id',
          to: 'Tech.companyId',
        },
      },
      workGroup: {
        relation: Model.HasOneRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Company.workGroupId',
          to: 'WorkGroup.id',
        },
      },
      dataSources: {
        relation: Model.HasManyRelation,
        modelClass: 'DataSource',
        join: {
          from: 'Company.id',
          to: 'DataSource.companyId',
        },
      },
      accounts: {
        relation: Model.HasManyRelation,
        modelClass: 'Account',
        join: {
          from: 'Company.id',
          to: 'Account.companyId',
        },
      },
    }
  }
}
