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
          role: 'tech',
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
            company: { '#ref': 'ccsCompany' },
            permissions: [{ type: 'read' }],
          },
        },
      ],
    },
  ])
  .returning('*')
}
