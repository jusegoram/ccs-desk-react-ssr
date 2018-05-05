import { Model } from 'objection'
import { APIModel, BaseQueryBuilder } from 'server/api/util'

export default class Appointment extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    // <custom>
    table.uuid('workOrderId').notNullable().index()
    table.uuid('techId').index()
    table.date('date')
    table.string('status')
    table.jsonb('row').index()
    table.unique(['workOrderId', 'techId', 'date'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('workOrderId').references('WorkOrder.id')
    table.foreign('techId').references('Tech.id')
  `

  static jsonSchema = {
    title: 'WorkOrder',
    description: 'A request from a customer for work',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      date: { type: ['string', 'null'], format: 'date' },
      status: { type: ['string', 'null'] },
      // </custom>
    },
  }

  static visible = ['id', 'workOrderId', 'techId', 'workOrder', 'assignedTech', 'date', 'status']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        return super._contextFilter()
      }
    }
  }

  static get relationMappings() {
    return {
      workOrder: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'WorkOrder',
        join: {
          from: 'Appointment.workOrderId',
          to: 'WorkOrder.id',
        },
      },
      assignedTech: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Tech',
        join: {
          from: 'Appointment.techId',
          to: 'Tech.id',
        },
      },
    }
  }
}
