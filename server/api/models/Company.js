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
      employees: {
        relation: Model.HasManyRelation,
        modelClass: 'Employee',
        join: {
          from: 'Company.id',
          to: 'Employee.companyId',
        },
      },
    }
  }
}
