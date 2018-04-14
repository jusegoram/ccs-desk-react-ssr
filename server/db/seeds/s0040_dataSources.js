import { DataSource } from 'server/api/models'

exports.seed = async function() {
  await DataSource.query().upsertGraph([
    {
      service: 'Goodman Analytics',
      name: 'Tech Profile',
    },
    {
      service: 'Goodman Analytics',
      name: 'Siebel Routelog',
    },
    {
      service: 'Goodman Analytics',
      name: 'EdgeMW Routelog',
    },
    {
      service: 'DirectSat Analytics',
      name: 'Tech Profile',
    },
    {
      service: 'DirectSat Analytics',
      name: 'Routelog',
    },
    {
      service: 'DirectSat Analytics',
      name: 'Pending',
    },
  ])
}
