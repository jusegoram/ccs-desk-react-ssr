import { Model } from 'objection'
import { Account } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  await Account.query()
  .insertGraph([
    {
      name: 'Tim Huff',
      email: 'timhuff@gmail.com',
      password: 'asdf',
    },
  ])
  .returning('*')
}
