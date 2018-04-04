import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Company extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('name').unique()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static jsonSchema = {
    title: 'Company',
    description: 'A company',
    type: 'object',

    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    },
  }

  static visible = ['id', 'name']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {
      workGroups: {
        relation: Model.HasManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Company.id',
          to: 'WorkGroup.companyId',
        },
      },
      featureSet: {
        relation: Model.HasManyRelation,
        modelClass: 'FeatureSet',
        join: {
          from: 'Company.id',
          to: 'FeatureSet.companyId',
        },
      },
      employees: {
        relation: Model.HasManyRelation,
        modelClass: 'Employee',
        join: {
          from: 'Company.id',
          to: 'Employee.companyId',
        },
      },
      vehicles: {
        relation: Model.HasManyRelation,
        modelClass: 'Vehicle',
        join: {
          from: 'Company.id',
          to: 'Vehicle.companyId',
        },
      },
      reportTemplates: {
        relation: Model.HasManyRelation,
        modelClass: 'Report',
        join: {
          from: 'Company.id',
          to: 'Report.companyId',
        },
        modify: qb => {
          qb.where({ isTemplate: true })
        },
      },
    }
  }
}
