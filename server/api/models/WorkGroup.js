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
    table.uuid('companyId').index()
    table.integer('order').notNullable()
    table.string('type').notNullable() // 'Company', 'Office', 'Team', 'DMA', 'Service Region', 'Division'
    table.string('externalId').notNullable()
    table.string('name').notNullable()
    table.unique(['companyId', 'type', 'externalId'])
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
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

  static visible = ['id', 'company', 'externalId', 'order', 'type', 'name']

  static orderMap = {
    Company: 0,
    Subcontractor: 1,
    Division: 2,
    DMA: 3,
    Office: 4,
    'Service Region': 5,
    Team: 6,
    Tech: 7,
  }

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        this.where({ 'WorkGroup.companyId': session.account.company.id })
        this.orderBy('WorkGroup.order')
        return this
      }

      async ensure({ companyId, type, externalId, name }, cache) {
        if (!externalId) return null
        if (cache) {
          cache[companyId] = cache[companyId] || {}
          cache[companyId][type] = cache[companyId][type] || {}
          if (cache[companyId][type][externalId]) return cache[companyId][type][externalId]
        }
        const order = WorkGroup.orderMap[type]
        const workGroup = await this.upsert({
          query: { companyId, type, externalId },
          update: { name, order },
        })
        if (cache) cache[companyId][type][externalId] = workGroup
        return workGroup
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

  static get relationMappings() {
    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'WorkGroup.id',
          to: 'Company.workGroupId',
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
      techs: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Tech',
        join: {
          from: 'WorkGroup.id',
          through: {
            from: 'workGroupTechs.workGroupId',
            to: 'workGroupTechs.techId',
          },
          to: 'Tech.id',
        },
      },
    }
  }
}
