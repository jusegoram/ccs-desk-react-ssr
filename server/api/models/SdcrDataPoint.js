import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'

export default class SdcrDataPoint extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.date('date').notNullable()
    table.integer('value').notNullable()
    table.string('type').notNullable()
    table.string('dwellingType').notNullable()
    table.string('workOrderExternalId')
    table.json('row')
    table.index(['date', 'workOrderExternalId'])
    table.uuid('appointmentId').index()
    table.uuid('techId').notNullable().index()
  `
  static knexAlterTable = `
    table.foreign('appointmentId').references('Appointment.id')
    table.foreign('techId').references('Tech.id')
  `
  static knexCreateJoinTables = {
    sdcrDataPointWorkGroups: `
      table.uuid('sdcrDataPointId').notNullable()
      table.uuid('workGroupId').notNullable()
      table.primary(['sdcrDataPointId', 'workGroupId'])
      table.unique(['workGroupId', 'sdcrDataPointId'])
      table.foreign('sdcrDataPointId').references('SdcrDataPoint.id').onDelete('CASCADE')
      table.foreign('workGroupId').references('WorkGroup.id')
    `,
  }
  static jsonSchema = {
    title: 'WorkGroupMetric',
    description: 'A person or group of people that fulfills work orders',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      type: { type: 'string' },
      date: { type: 'string', format: 'date' },
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
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'SdcrDataPoint.id',
          through: {
            from: 'sdcrDataPointWorkGroups.sdcrDataPointId',
            to: 'sdcrDataPointWorkGroups.workGroupId',
          },
          to: 'WorkGroup.id',
        },
      },
    }
  }
}
