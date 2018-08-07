const Knex = require('knex')
const moment = require('moment-timezone')

const knexfile = require('../knexfile')

const knex = Knex(knexfile['production'])
moment.tz.setDefault('America/Chicago')

const run = async () => {
  await knex('workGroupSdcrDataPoints').delete()
  await knex('SdcrDataPoint').delete()
}
run()
