import { Model } from 'objection'
import { FormTemplate } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  await FormTemplate.query()
  .insertGraph([
    {
      name: 'timecard',
      questions: [
        { text: 'Trunk Number', type: 'image', section: 'Images' },
        { text: 'Hood', type: 'image', section: 'Images' },
        { text: 'Tire', type: 'image', section: 'Images' },
      ],
    },
  ])
  .returning('*')
}
