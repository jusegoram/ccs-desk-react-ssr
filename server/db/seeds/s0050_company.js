import { Model } from 'objection'
import { Company } from 'server/api/models'

exports.seed = async function(knex) {
  Model.knex(knex)

  await Company.query()
  .insertGraph([
    {
      name: 'DirecTV',
    },
    {
      '#id': 'directsat',
      name: 'DirectSat',
      dataSources: [
        {
          company: { '#ref': 'directsat' },
          name: 'Tech Profile',
        },
        {
          company: { '#ref': 'directsat' },
          name: 'Siebel Routelog',
        },
        {
          company: { '#ref': 'directsat' },
          name: 'Edge MW Routelog',
        },
        {
          company: { '#ref': 'directsat' },
          name: 'Edge SE Routelog',
        },
        {
          company: { '#ref': 'directsat' },
          name: 'Edge SW Routelog',
        },
        {
          company: { '#ref': 'directsat' },
          name: 'Edge W Routelog',
        },
      ],
    },
    {
      '#id': 'goodman',
      name: 'Goodman',
      dataSources: [
        {
          company: { '#ref': 'goodman' },
          name: 'Tech Profile',
        },
        {
          company: { '#ref': 'goodman' },
          name: 'Siebel Routelog',
        },
        {
          company: { '#ref': 'goodman' },
          name: 'Edge MW Routelog',
        },
        {
          company: { '#ref': 'goodman' },
          name: 'Edge SE Routelog',
        },
        {
          company: { '#ref': 'goodman' },
          name: 'Edge SW Routelog',
        },
        {
          company: { '#ref': 'goodman' },
          name: 'Edge W Routelog',
        },
      ],
    },
    {
      '#id': 'ccsCompany',
      name: 'CCS',
      accounts: [
        {
          name: 'Root Account',
          email: 'root@example.com',
          password: 'demo',
          root: true,
          company: { '#ref': 'ccsCompany' },
        },
      ],
    },
  ])
  .returning('*')
}
