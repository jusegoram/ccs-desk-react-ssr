import { Model } from 'objection'
import { Company } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  await Company.query()
  .insertGraph([
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
          role: 'Tech',
          workGroup: {
            externalId: 'agent@example.com',
            name: 'Agent Smith',
            type: 'Tech',
            company: { '#ref': 'ccsCompany' },
            techs: [{ '#ref': 'employee1' }],
          },
          account: {
            name: 'Agent Smith',
            email: 'agent@example.com',
            password: 'demo',
            root: true,
            company: { '#ref': 'ccsCompany' },
            permissions: [{ type: 'read' }],
          },
        },
        {
          '#id': 'employee2',
          name: 'Agent Mueller',
          email: 'agent2@example.com',
          externalId: 'agent2@example.com',
          phoneNumber: '5555555555',
          role: 'Tech',
          workGroup: {
            externalId: 'agent2@example.com',
            name: 'Agent Mueller',
            type: 'Tech',
            company: { '#ref': 'ccsCompany' },
            techs: [{ '#ref': 'employee2' }],
          },
          account: {
            name: 'Agent Mueller',
            email: 'agent2@example.com',
            password: 'demo',
            company: { '#ref': 'ccsCompany' },
            permissions: [{ type: 'read' }],
          },
        },
      ],
    },
  ])
  .returning('*')
}
