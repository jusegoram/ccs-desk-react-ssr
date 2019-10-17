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
    table.uuid('companyId').index()
    table.uuid('startLocationId').index()
    table.uuid('dataSourceId').index()
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
      tempClaimId: { type: ['string', 'null'] },
      tempClaimTeamId: { type: ['string', 'null'] },
      tempClaimTeamName: { type: ['string', 'null'] },
      tempClaimTeamPhone: { type: ['string', 'null'] },
      tempClaimFromDate: { type: ['string', 'null'], format: 'date-time' },
      tempClaimToDate: { type: ['string', 'null'], format: 'date-time' },
    },
  }
  // , properties: {
  //   'Company': { type: 'string'},
  //   'DMA': { type: 'string'},
  //   'End Of Day City': { type: 'string'},
  //   'EndofDayLatitude': { type: 'string', resolve: (parent) => parent.row['End of Day Latitude']  },
  //   'EndofDayLongitude': { type: 'string' , resolve: (parent) => parent['End of Day Latitude']},
  //   'EndofDayState': { type: 'string' , resolve: (parent) => parent['End of Day State']},
  //   'EndofDayStreet': { type: 'string' , resolve: (parent) => parent['End of Day Street']},
  //   'EndofDayZip': { type: 'string' , resolve: (parent) => parent['End of Day Zip']},
  //   'MaxTravelMiles': { type: 'string' , resolve: (parent) => parent['Max Travel Miles']},
  //   'Office': { type: 'string'},
  //   'Region': { type: 'string'},
  //   'ServiceRegion': { type: 'string' , resolve: (parent) => parent['Service Region']},
  //   'SkillPackage': { type: 'string' , resolve: (parent) => parent['Skill Package']},
  //   'StartCity': { type: 'string' , resolve: (parent) => parent['Start City']},
  //   'StartLatitude': { type: 'string' , resolve: (parent) => parent['Start Latitude']},
  //   'StartLongitude': { type: 'string' , resolve: (parent) => parent['Start Longitude']},
  //   'StartState': { type: 'string' , resolve: (parent) => parent['Start State']},
  //   'StartStreet': { type: 'string' , resolve: (parent) => parent['Start Street']},
  //   'StartZip': { type: 'string' , resolve: (parent) => parent['Start Zip']},
  //   'Team': { type: 'string'},
  //   'teamEmail': { type: 'string'},
  //   'TeamID': { type: 'string' , resolve: (parent) => parent['Team ID']},
  //   'TeamName': { type: 'string' , resolve: (parent) => parent['Team Name']},
  //   'Tech': { type: 'string' },
  //   'TechATTUID': { type: 'string' , resolve: (parent) => parent['Tech ATT UID']},
  //   'TechEfficiency': { type: 'string' , resolve: (parent) => parent['Tech Efficiency']},
  //   'TechFullName': { type: 'string' , resolve: (parent) => parent['Tech Full Name']},
  //   'TechMobilePhone': { type: 'string' , resolve: (parent) => parent['Tech Mobile Phone #']},
  //   'TechSchedule': { type: 'string' , resolve: (parent) => parent['Tech Schedule']},
  //   'TechTeamSupervisorLogin': { type: 'string' , resolve: (parent) => parent['Tech Team Supervisor Login']},
  //   'TechTeamSupervisorMobile': { type: 'string' , resolve: (parent) => parent['Tech Team Supervisor Mobile #']},
  //   'TechType': { type: 'string' , resolve: (parent) => parent['Tech Type']},
  //   'TechUserID': { type: 'string' , resolve: (parent) => parent['Tech User ID']},
  // },
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
    'tempClaimId',
    'tempClaimTeamId',
    'tempClaimTeamName',
    'tempClaimTeamPhone',
    'tempClaimFromDate',
    'tempClaimToDate',
    'row',
  ]

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        const { session } = super._contextFilter().context()
        if (session.rootAccount && session.account.id === session.rootAccount.id) return this

        const knex = this.knex()
        const companyWorkGroupIds = knex('WorkGroup')
        .select('id')
        .where({ companyId: session.account.company.id })
        const visibleTechIds = knex('workGroupTechs')
        .select('techId')
        .whereIn('workGroupId', companyWorkGroupIds)
        this.whereIn('id', visibleTechIds)
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
      workGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: 'WorkGroup',
        join: {
          from: 'Tech.id',
          through: {
            from: 'workGroupTechs.techId',
            to: 'workGroupTechs.workGroupId',
          },
          to: 'WorkGroup.id',
        },
      },
    }
  }
}
