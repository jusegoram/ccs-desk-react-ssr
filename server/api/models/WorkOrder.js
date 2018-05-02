import { Model } from 'objection'
import { APIModel, BaseQueryBuilder } from 'server/api/util'

export default class WorkOrder extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    // <custom>
    table.string('externalId').unique()
    table.date('date')
    table.string('type')
    table.string('status')
    table.uuid('companyId')
    table.json('row')
    table.unique(['companyId', 'externalId'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexCreateJoinTables = {
    workGroupWorkOrders: `
      table.uuid('workOrderId').notNullable()
      table.uuid('workGroupId').notNullable()
      table.primary(['workOrderId', 'workGroupId'])
      table.unique(['workGroupId', 'workOrderId'])
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
      date: { type: ['string', 'null'], format: 'date' },
      status: { type: ['string', 'null'] },
      // </custom>
    },
  }

  static visible = ['id', 'externalId', 'type', 'status', 'date', 'workGroups']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        if (!session) return this
        const workOrderIds = this.clone()
        .select('WorkOrder.id')
        .joinRelation('workGroups')
        .where('workGroups.companyId', session.account.company.id)
        this.whereIn('id', workOrderIds)
        return this
      }
    }
  }

  static get relationMappings() {
    return {
      appointments: {
        relation: Model.HasManyRelation,
        modelClass: 'Appointment',
        join: {
          from: 'WorkOrder.id',
          to: 'Appointment.workOrderId',
        },
      },
    }
  }
}
