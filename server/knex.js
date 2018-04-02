import Knex from 'knex'
import knexfile from 'server/../knexfile'

console.log(knexfile[process.env.NODE_ENV])
export default Knex({
  debug: process.env.NODE_ENV === 'development',
  ...knexfile[process.env.NODE_ENV],
})
