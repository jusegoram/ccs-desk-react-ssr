import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'

export default class DataSource extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('companyId')
    table.string('name')
    table.json('reports')
    table.unique(['companyId', 'name'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexCreateJoinTables = {
    companyDataSources: `
      table.uuid('dataSourceId').notNullable()
      table.uuid('companyId').notNullable()
      table.primary(['dataSourceId', 'companyId'])
      table.unique(['companyId', 'dataSourceId'])
      table.foreign('dataSourceId').references('DataSource.id')
      table.foreign('companyId').references('Company.id')
    `,
  }
  static jsonSchema = {
    title: 'Data Source',
    description: 'A source of data used to import information into the system',
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
        this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'DataSource.companyId',
          to: 'Company.id',
        },
      },
      fedCompanies: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Company',
        join: {
          from: 'DataSource.id',
          through: {
            from: 'companyDataSources.dataSourceId',
            to: 'companyDataSources.companyId',
          },
          to: 'Company.id',
        },
      },
      dataImports: {
        relation: Model.HasManyRelation,
        modelClass: 'DataImport',
        join: {
          from: 'DataSource.id',
          to: 'DataImport.dataSourceId',
        },
      },
    }
  }
}
