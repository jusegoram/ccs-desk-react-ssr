import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class DataImport extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid('dataSourceId')
    table.string('status').defaultTo('pending')
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
      status: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      completedAt: { type: 'string', format: 'date-time' },
    },
  }

  static visible = ['id', 'status', 'dataSource', 'createdAt', 'downloadedAt', 'completedAt']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        this.whereRaw('FALSE')
      }
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
