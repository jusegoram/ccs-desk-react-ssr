import { Model } from 'objection'
import { APIModel, BaseQueryBuilder } from 'server/api/util'

export default class WorkOrder extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    // <custom>
    table.uuid('dataSourceId').index()
    table.string('externalId').index()
    table.date('date')
    table.string('type')
    table.string('status')
    table.jsonb('data')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('dataSourceId').references('DataSource.id')
  `
  static knexCreateJoinTables = {
    workGroupWorkOrders: `
      table.uuid('workGroupId').notNullable()
      table.uuid('workOrderId').notNullable()
      table.primary(['workGroupId', 'workOrderId'])
      table.unique(['workOrderId', 'workGroupId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('workOrderId').references('WorkOrder.id')
    `,
  }
  static jsonSchema = {
    title: 'WorkOrder',
    description: 'A request from a customer for work',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      externalId: { type: ['string', 'null'] },
      date: { type: 'string', format: 'date' },
      status: { type: ['string', 'null'] },
      // </custom>
    },
  }

  static visible = ['id', 'externalId', 'type', 'status', 'date']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {}
  }

  static get relationMappings() {
    return {
      dataSource: {
        relation: Model.HasOneRelation,
        modelClass: 'DataSource',
        join: {
          from: 'WorkOrder.dataSourceId',
          to: 'DataSource.id',
        },
      },
      workGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'WorkOrder.id',
          through: {
            from: 'workGroupWorkOrder.workOrderId',
            to: 'workGroupWorkOrder.workGroupId',
          },
          to: 'WorkGroup.id',
        },
      },
    }
  }
}
