import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'

export default class DataImport extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('dataSourceId').index()
    table.string('reportName')
    table.string('status').defaultTo('Pending')
    table.text('error')
    table.timestamp('downloadedAt')
    table.timestamp('completedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('dataSourceId').references('DataSource.id')
  `
  static jsonSchema = {
    title: 'Data Import',
    description: 'A specific download of data from a data source',
    type: 'object',

    properties: {
      id: { type: 'string' },
      reportName: { type: 'string' },
      status: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      downloadedAt: { type: ['string', 'null'], format: 'date-time' },
      completedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = [
    'id',
    'reportName',
    'status',
    'dataSource',
    'createdAt',
    'downloadedAt',
    'completedAt',
    'downloadedAt',
  ]

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        super._contextFilter()
        const { session } = this.context()
        if (session.rootAccount && session.account.id === session.rootAccount.id) return this
        const dataSourceIds = DataImport.knex()('DataSource')
        .select('id')
        .join('companyDataSources', 'DataSource.id', 'companyDataSources.dataSourceId')
        .where('companyDataSources.companyId', session.account.company.id)
        this.whereIn('DataImport.dataSourceId', dataSourceIds)

        return this
      }
      // _mine() {
      //   console.log('mine')
      // }
    }
  }

  static get relationMappings() {
    return {
      dataSource: {
        relation: Model.HasOneRelation,
        modelClass: 'DataSource',
        join: {
          from: 'DataImport.dataSourceId',
          to: 'DataSource.id',
        },
      },
    }
  }
}
