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
    },
    {
      '#id': 'ccsCompany',
      name: 'CCS',
      employees: [
        {
          '#id': 'employee1',
          name: 'Agent Smith',
          email: 'root@example.com',
          externalId: 'root@example.com',
          phoneNumber: '5555555555',
          timezone: 'America/Chicago',
          role: 'Tech',
          workGroup: {
            externalId: 'root@example.com',
            name: 'Agent Smith',
            type: 'Tech',
            order: 7,
            company: { '#ref': 'ccsCompany' },
            techs: [{ '#ref': 'employee1' }],
          },
          account: {
            name: 'Agent Smith',
            email: 'root@example.com',
            password: 'demo',
            root: true,
            company: { '#ref': 'ccsCompany' },
          },
        },
      ],
    },
  ])
  .returning('*')
}
