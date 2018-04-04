import { Model } from 'objection'
import { Company, Account } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  await Company.query()
  .insertGraph([
    {
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
            techs: [{ '#ref': 'employee1' }],
          },
          account: {
            name: 'Agent Smith',
            email: 'agent@example.com',
            password: 'demo',
            permissions: [{ type: 'read' }],
          },
        },
      ],
    },
  ])
  .returning('*')
}
