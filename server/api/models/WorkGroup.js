import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'
import Promise from 'bluebird'
import _ from 'lodash'

const dtvWorkGroups = {}

export default class WorkGroup extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.uuid('companyId')
    table.integer('order').notNullable()
    table.string('type').notNullable() // 'Company', 'Office', 'Team', 'DMA', 'Service Region', 'Division'
    table.string('externalId').notNullable()
    table.string('name').notNullable()
    table.unique(['companyId', 'type', 'externalId'])
    table.uuid('geographyId')
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('geographyId').references('Geography.id')
    table.foreign('companyId').references('Company.id')
  `
  static knexCreateJoinTables = {
    directv_sr_data: `
      table.string('Service Region').index()
      table.string('Office')
      table.string('DMA')
      table.string('Division')
      table.string('HSP')
    `,
  }
  static jsonSchema = {
    title: 'WorkGroup',
    description: 'A person or group of people that fulfills work orders',
    type: 'object',

    properties: {
      id: { type: 'string' },
      // <custom>
      order: { type: 'number' },
      type: { type: 'string' },
      externalId: { type: ['string', 'null'] },
      name: { type: 'string' },
      // </custom>
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = [
    'id',
    'company',
    'externalId',
    'order',
    'type',
    'name',
    'phoneNumber',
    'email',
    'employees',
    'managers',
    'workOrders',
  ]

  static orderMap = {
    Company: 0,
    Division: 1,
    DMA: 2,
    Office: 3,
    'Service Region': 4,
    Team: 5,
    Tech: 6,
  }

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        // const { session } = this.context()
        // if (session === undefined) return
        // if (session === null) return this.whereRaw('FALSE')
        this.orderBy('WorkGroup.order')
      }

      async ensure({ type, companyId, externalId, name }) {
        const order = WorkGroup.orderMap[type]
        return this.upsert({
          query: { companyId, type, externalId },
          update: { name, order },
        })
      }

      async getDtvWorkGroups(w2Company) {
        if (dtvWorkGroups[w2Company]) return dtvWorkGroups[w2Company]
        const ensureDtvWorkGroups = async type => {
          const workGroups = await this.clone().where({ companyId: w2Company.id, type })
          if (workGroups.length !== 0) return workGroups
          return await createAllWorkGroupsOfType(type)
        }
        const createAllWorkGroupsOfType = async type => {
          const knex = Model.knex()
          const namesForType = _.map(
            await knex
            .distinct(type)
            .from('directv_sr_data')
            .where({ HSP: w2Company.name }),
            type
          )
          const order = WorkGroup.orderMap[type]
          return await Promise.mapSeries(namesForType, async name => {
            return await this.clone().insert({
              companyId: w2Company.id,
              externalId: name,
              order,
              name,
              type,
            })
          })
        }
        return await Promise.props({
          'Service Region': ensureDtvWorkGroups('Service Region'),
          Office: ensureDtvWorkGroups('Office'),
          DMA: ensureDtvWorkGroups('DMA'),
          Division: ensureDtvWorkGroups('Division'),
        })
      }
    }
  }

  async addTech(employee) {
    if (!employee.workGroups) await employee.$loadRelated('workGroups')
    const alreadyInWorkGroup = !!_.find(employee.workGroups, { id: this.id })
    if (!alreadyInWorkGroup) await employee.$relatedQuery('workGroups').relate(this)
  }
  async addManager(employee) {
    if (!employee.managedWorkGroups) await employee.$loadRelated('managedWorkGroups')
    const alreadyInWorkGroup = !!_.find(employee.managedWorkGroups, { id: this.id })
    if (!alreadyInWorkGroup) await employee.$relatedQuery('managedWorkGroups').relate(this)
  }
  async addWorkOrder(workOrder) {
    if (!workOrder.workGroups) await workOrder.$loadRelated('workGroups')
    const alreadyInWorkGroup = !!_.find(workOrder.workGroups, { id: this.id })
    if (!alreadyInWorkGroup) await workOrder.$relatedQuery('workGroups').relate(this)
  }

  static get relationMappings() {
    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'WorkGroup.companyId',
          to: 'Company.id',
        },
      },
      managers: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Employee',
        modify: qb => qb.where({ 'workGroupEmployees.role': 'Manager' }),
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupEmployees.workGroupId',
            to: 'workGroupEmployees.employeeId',
            beforeInsert(model) {
              model.role = 'Manager'
            },
          },
          to: 'Employee.id',
        },
      },
      techs: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Employee',
        modify: qb => qb.where({ 'workGroupEmployees.role': 'Tech' }),
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupEmployees.workGroupId',
            to: 'workGroupEmployees.employeeId',
            beforeInsert(model) {
              model.role = 'Tech'
            },
          },
          to: 'Employee.id',
        },
      },
      employees: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Employee',
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupEmployees.workGroupId',
            to: 'workGroupEmployees.employeeId',
          },
          to: 'Employee.id',
        },
      },
      workOrders: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkOrder',
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupWorkOrders.workGroupId',
            to: 'workGroupWorkOrders.workOrderId',
          },
          to: 'WorkOrder.id',
        },
      },
    }
  }
}
