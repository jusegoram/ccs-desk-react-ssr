import { withDeletedAt } from 'server/api/util/mixins'
import APIModel from 'server/api/util/APIModel'
import { QueryBuilder, Model } from 'objection'

export default class Permission extends withDeletedAt(APIModel) {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.timestamp('deletedAt').index()
    // <custom>
    table.uuid('accountId')
    table.string('type').defaultTo('read').notNullable()
    // </custom>
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `
  static knexCreateJoinTables = {
    permissionWorkGroups: `
      table.uuid('permissionId').notNullable()
      table.uuid('workGroupId').notNullable()
      table.primary(['permissionId', 'workGroupId'])
      table.unique(['workGroupId', 'permissionId'])
      table.foreign('permissionId').references('Permission.id')
      table.foreign('workGroupId').references('WorkGroup.id')
    `,
  }
  static jsonSchema = {
    title: 'Permission',
    description: 'Permission to read or write the members of a subtree of the organization graph',
    type: 'object',

    properties: {
      id: { type: 'string' },
      readOnly: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  }

  static visible = ['id', 'readOnly', 'workGroup']

  static get QueryBuilder() {
    return class extends QueryBuilder {
      _contextFilter() {
        const { session } = this.context()
        if (session === undefined) return
        if (session === null) return this.whereRaw('FALSE')
      }
    }
  }

  static get relationMappings() {
    return {
      workGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Permission.id',
          through: {
            from: 'permissionWorkGroups.permissionId',
            to: 'permissionWorkGroups.workGroupId',
          },
          to: 'WorkGroup.id',
        },
      },
    }
  }
}
