import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { Model } from 'objection'

export default class Tech extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('terminatedAt')
    table.string('externalId').notNullable()
    table.string('alternateExternalId').index()
    table.string('timezone')
    table.string('name')
    table.string('phoneNumber')
    table.string('email')
    table.string('skills')
    table.string('schedule')
    table.json('row')
    table.uuid('companyId')
    table.uuid('startLocationId')
    table.uuid('dataSourceId')
    table.unique(['companyId', 'externalId'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexAlterTable = `
    table.foreign('companyId').references('Company.id')
    table.foreign('startLocationId').references('Geography.id')
    table.foreign('dataSourceId').references('DataSource.id')
  `
  static knexCreateJoinTables = {
    workGroupTechs: `
      table.uuid('workGroupId').notNullable()
      table.uuid('techId').notNullable()
      table.unique(['workGroupId', 'techId'])
      table.primary(['techId', 'workGroupId'])
      table.foreign('workGroupId').references('WorkGroup.id')
      table.foreign('techId').references('Tech.id')
    `,
  }
  static jsonSchema = {
    title: 'Tech',
    description: 'An employee',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      externalId: { type: 'string' },
      alternateExternalId: { type: ['string', 'null'] },
      timezone: { type: ['string', 'null'] },
      phoneNumber: { type: ['string', 'null'] },
      email: { type: ['string', 'null'] },
      skills: { type: ['string', 'null'] },
      schedule: { type: ['string', 'null'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      terminatedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = [
    'id',
    'name',
    'externalId',
    'phoneNumber',
    'timezone',
    'email',
    'skills',
    'schedule',
    'timecard',
    'vehicleClaim',
    'timecards',
    'vehicleClaims',
    'company',
    'workGroups',
  ]

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        if (!session) return this
        return this
      }
    }
  }

  static get relationMappings() {
    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Company',
        join: {
          from: 'Tech.companyId',
          to: 'Company.id',
        },
      },
    }
  }
}
