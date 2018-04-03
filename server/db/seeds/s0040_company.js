import { Model } from 'objection'
import { Company, Account } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  const section = 'Images'
  const answerType = 'image'

  await Company.query()
  .insertGraph([
    {
      name: 'CCS',
      employees: [
        {
          name: 'Agent Smith',
          externalId: 'agent@example.com',
          phoneNumber: '5555555555',
          account: {
            name: 'Agent Smith',
            email: 'agent@example.com',
            password: 'demo',
          },
        },
      ],
    },
  ])
  .returning('*')
  await Account.query().insertGraph({
    name: 'Joe Admin',
    email: 'admin@example.com',
    password: 'demo',
  })
}
