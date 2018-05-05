import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'

export default class SdcrDataPoint extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.date('date').notNullable()
    table.integer('value').notNullable()
    table.uuid('workGroupId').notNullable()
    table.uuid('workOrderId').notNullable()
    table.uuid('techId').notNullable()
  `
  static knexAlterTable = `
    table.foreign('workGroupId').references('WorkGroup.id')
    table.foreign('workOrderId').references('WorkOrder.id')
    table.foreign('techId').references('Tech.id')
  `
  static jsonSchema = {
    title: 'WorkGroupMetric',
    description: 'A person or group of people that fulfills work orders',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      type: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      value: { type: 'number' },
    },
  }

  static visible = ['id', 'type', 'date', 'value']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        return this
      }
    }
  }

  static get relationMappings() {
    return {
      workGroups: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'SdcrDataPoint.workGroupId',
          to: 'WorkGroup.id',
        },
      },
    }
  }
}
