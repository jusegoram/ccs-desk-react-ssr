import { Model } from 'objection'
import { APIModel, BaseQueryBuilder } from 'server/api/util'

export default class Appointment extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    // <custom>
    table.uuid('workOrderId').notNullable()
    table.uuid('employeeId')
    table.date('date')
    table.string('status')
    table.jsonb('row').index()
    table.unique(['workOrderId', 'employeeId', 'date'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('workOrderId').references('WorkOrder.id')
    table.foreign('employeeId').references('Employee.id')
  `

  static jsonSchema = {
    title: 'WorkOrder',
    description: 'A request from a customer for work',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      date: { type: 'string', format: 'date' },
      status: { type: ['string', 'null'] },
      // </custom>
    },
  }

  static visible = ['id', 'workOrderId', 'employeeId', 'workOrder', 'assignedTech', 'date', 'status']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {}
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
        modelClass: 'Employee',
        join: {
          from: 'Appointment.employeeId',
          to: 'Employee.id',
        },
      },
    }
  }
}
