import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'
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
    workGroupEmployees: `
      table.uuid('workGroupId').notNullable()
      table.uuid('employeeId').notNullable()
      table.string('role').notNullable()
      table.primary(['role', 'workGroupId', 'employeeId'])
      table.unique(['role', 'employeeId', 'workGroupId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('employeeId').references('Employee.id')
    `,
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

  static visible = ['id', 'company', 'order', 'type', 'name', 'phoneNumber', 'email', 'employees', 'managers']

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
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
        this.orderBy('WorkGroup.order')
      }

      async ensure({ w2Company, type, companyId, externalId, name }) {
        const workGroups = await this.clone().getDtvWorkGroups(w2Company)
        workGroups[type] = workGroups[type] || {}
        if (workGroups[type][externalId]) return workGroups[type][externalId]
        const queryProps = { type, companyId, externalId }
        const order = WorkGroup.orderMap[type]
        workGroups[type][externalId] =
          (await this.clone()
          .where(queryProps)
          .first()) ||
          (await this.clone()
          .insert({ ...queryProps, order, name })
          .returning('*'))
        return workGroups[type][externalId]
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
    }
  }
}
