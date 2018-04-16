import { Model } from 'objection'
import { Company } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  await Company.query()
  .insertGraph([
    {
      '#id': 'directsatCompany',
      name: 'DirectSat',
      dataSources: [
        {
          '#id': 'directsatSiebel',
          company: { '#ref': 'directsatCompany' },
          name: 'Siebel',
          reports: JSON.stringify(['Tech Profile', 'Routelog']),
        },
        {
          '#id': 'directsatEdge',
          company: { '#ref': 'directsatCompany' },
          name: 'Edge',
          reports: JSON.stringify(['MW Routelog']),
        },
      ],
    },
    {
      '#id': 'goodmanCompany',
      name: 'Goodman',
      dataSources: [
        {
          '#id': 'goodmanSiebel',
          company: { '#ref': 'goodmanCompany' },
          name: 'Siebel',
          reports: JSON.stringify(['Tech Profile', 'Routelog']),
        },
        {
          '#id': 'goodmanEdge',
          company: { '#ref': 'goodmanCompany' },
          name: 'Edge',
          reports: JSON.stringify(['MW Routelog']),
        },
      ],
      employees: [
        {
          '#id': 'goodmanAdmin',
          name: 'Joe Goodman',
          email: 'goodman@example.com',
          externalId: 'goodman@example.com',
          phoneNumber: '5555555555',
          timezone: 'America/Chicago',
          role: 'Manager',
          account: {
            name: 'Joe Goodman',
            email: 'goodman@example.com',
            password: 'demo',
            company: { '#ref': 'goodmanCompany' },
          },
        },
      ],
    },
    {
      '#id': 'ccsCompany',
      name: 'CCS',
      employees: [
        {
          '#id': 'employee1',
          name: 'Agent Smith',
          email: 'agent@example.com',
          externalId: 'agent@example.com',
          phoneNumber: '5555555555',
          timezone: 'America/Chicago',
          role: 'Tech',
          workGroup: {
            externalId: 'agent@example.com',
            name: 'Agent Smith',
            type: 'Tech',
            order: 7,
            company: { '#ref': 'ccsCompany' },
            techs: [{ '#ref': 'employee1' }],
          },
          account: {
            name: 'Agent Smith',
            email: 'agent@example.com',
            password: 'demo',
            root: true,
            company: { '#ref': 'ccsCompany' },
          },
        },
        {
          '#id': 'employee2',
          name: 'Agent Mueller',
          email: 'agent2@example.com',
          externalId: 'agent2@example.com',
          phoneNumber: '5555555555',
          timezone: 'America/New_York',
          role: 'Tech',
          workGroup: {
            externalId: 'agent2@example.com',
            name: 'Agent Mueller',
            type: 'Tech',
            order: 7,
            company: { '#ref': 'ccsCompany' },
            techs: [{ '#ref': 'employee2' }],
          },
          account: {
            name: 'Agent Mueller',
            email: 'agent2@example.com',
            password: 'demo',
            company: { '#ref': 'ccsCompany' },
          },
        },
      ],
    },
    {
      '#id': 'empathCompany',
      name: 'Empath',
      dataSources: [
        { '#ref': 'goodmanSiebel' },
        { '#ref': 'goodmanEdge' },
        { '#ref': 'directsatSiebel' },
        { '#ref': 'directsatEdge' },
      ],
      employees: [
        {
          '#id': 'empathAdmin',
          name: 'Joe Empath',
          email: 'empath@example.com',
          externalId: 'empath@example.com',
          phoneNumber: '5555555555',
          timezone: 'America/Chicago',
          role: 'Manager',
          account: {
            name: 'Joe Empath',
            email: 'empath@example.com',
            password: 'demo',
            company: { '#ref': 'empathCompany' },
          },
        },
      ],
    },
  ])
  .returning('*')
}
