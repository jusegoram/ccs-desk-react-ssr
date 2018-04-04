import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model, raw } from 'objection'

export default class WorkOrder extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.string('externalId').index()
    table.string('type')
    table.string('status')
    table.boolean('pending')
    table.timestamp('dueDate')
    table.uuid('dataSourceId')
    table.uuid('workGroupId')
    table.uuid('locationId')
    table.uuid('customerId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('workGroupId').references('WorkGroup.id')
    table.foreign('dataSourceId').references('DataSource.id')
    table.foreign('locationId').references('Geography.id')
    table.foreign('customerId').references('Customer.id')
  `
  static knexCreateJoinTables = {
    workOrderGeographies: `
      table.uuid('workOrderId').notNullable()
      table.uuid('geographyId').notNullable()
      table.primary(['workOrderId', 'geographyId'])
      table.unique(['geographyId', 'workOrderId'])
      table.foreign('workOrderId').references('WorkOrder.id')
      table.foreign('geographyId').references('Geography.id')
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
      type: { type: ['string', 'null'] },
      status: { type: ['string', 'null'] },
      // </custom>
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'externalId', 'type', 'status', 'workGroup', 'geographies']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
      }
      near({ lat, lng, radius }) {
        this.whereRaw('ST_Distance(ST_Point(?, ?)::geography, location::geography) < ?', [lng, lat, radius]).orderBy(
          raw('ST_Distance(ST_Point(?, ?)::geography, location::geography)', [lng, lat])
        )
      }
    }
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
      customer: {
        relation: Model.HasOneRelation,
        modelClass: 'Customer',
        join: {
          from: 'WorkOrder.customerId',
          to: 'Customer.id',
        },
      },
      location: {
        relation: Model.HasOneRelation,
        modelClass: 'Geography',
        join: {
          from: 'WorkOrder.locationId',
          to: 'Geography.id',
        },
      },
      geographies: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Geography',
        join: {
          from: 'WorkOrder.id',
          through: {
            from: 'workOrderGeographies.workOrderId',
            to: 'workOrderGeographies.geographyId',
          },
          to: 'Geography.id',
        },
      },
    }
  }
}
