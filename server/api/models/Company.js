import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'
import { identity } from 'lodash'

const companies = {}

export default class Company extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('name').unique()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
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
      workGroups: {
        relation: Model.HasManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Company.id',
          to: 'WorkGroup.companyId',
        },
      },
      featureSet: {
        relation: Model.HasManyRelation,
        modelClass: 'FeatureSet',
        join: {
          from: 'Company.id',
          to: 'FeatureSet.companyId',
        },
      },
      employees: {
        relation: Model.HasManyRelation,
        modelClass: 'Employee',
        join: {
          from: 'Company.id',
          to: 'Employee.companyId',
        },
      },
      vehicles: {
        relation: Model.HasManyRelation,
        modelClass: 'Vehicle',
        join: {
          from: 'Company.id',
          to: 'Vehicle.companyId',
        },
      },
      reportTemplates: {
        relation: Model.HasManyRelation,
        modelClass: 'Report',
        join: {
          from: 'Company.id',
          to: 'Report.companyId',
        },
        modify: qb => {
          qb.where({ isTemplate: true })
        },
      },
      dataSources: {
        relation: Model.ManyToManyRelation,
        modelClass: 'DataSource',
        join: {
          from: 'Company.id',
          through: {
            from: 'companyDataSources.companyId',
            to: 'companyDataSources.dataSourceId',
          },
          to: 'DataSource.id',
        },
      },
    }
  }
}
