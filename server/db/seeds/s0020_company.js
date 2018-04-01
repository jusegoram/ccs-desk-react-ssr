import { Model } from 'objection'
import { Company } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  const section = 'Images'
  const answerType = 'image'

  await Company.query()
  .insertGraph([
    {
      name: 'Company A',
      employees: [
        {
          name: 'John Smith',
          externalId: 'jsmith@gmail.com',
          phoneNumber: '5555555555',
          account: {
            name: 'John Smith',
            email: 'timhuff@gmail.com',
            password: 'asdf',
          },
        },
      ],
      vehicles: [{ externalId: '1111' }, { externalId: '2222' }, { externalId: '3333' }],
      reportTemplates: [
        {
          name: 'Vehicle Condition',
          questions: [
            { order: 1, text: 'Truck Number', section, answerType },
            { order: 2, text: 'Hood', section, answerType },
            { order: 3, text: 'Tire', section, answerType },
          ],
        },
      ],
    },
  ])
  .returning('*')
}
