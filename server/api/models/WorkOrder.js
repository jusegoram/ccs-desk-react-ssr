import { Model } from 'objection'
import { APIModel, BaseQueryBuilder } from 'server/api/util'

export default class WorkOrder extends APIModel {
  static jsonSchema = {
    title: 'WorkOrder',
    description: 'A request from a customer for work',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      externalId: { type: ['string', 'null'] },
      dueDate: { type: ['string', 'null'], format: 'date' },
      status: { type: ['string', 'null'] },
      type: { type: ['string', 'null'] },
      // </custom>
    },
  }

  static visible = ['id', 'externalId', 'type', 'status', 'dueDate']

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        if (!session) return this
        if (session.account.company.name === 'CCS') return this
        return session.account.company.workGroup.$relatedQuery('workOrders')
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
      currentAppointment: {
        relation: Model.HasOneRelation,
        modelClass: 'Appointment',
        join: {
          from: 'WorkOrder.currentAppointmentId',
          to: 'Appointment.id',
        },
      },
    }
  }
}
