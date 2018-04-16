import Knex from 'knex'
import knexfile from 'server/../knexfile'

export default Knex({
  debug: process.env.DEBUG,
  ...knexfile[process.env.NODE_ENV],
})
