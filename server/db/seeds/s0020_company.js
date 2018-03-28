import { Model } from 'objection'
import { Company } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

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
          state: 'Template',
          questions: [
            { questionText: 'Trunk Number', answerType: 'image', order: 1 },
            { questionText: 'Hood', answerType: 'image', order: 2 },
            { questionText: 'Tire', answerType: 'image', order: 3 },
          ],
        },
      ],
    },
  ])
  .returning('*')
}
