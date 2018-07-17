import Knex from 'knex'
import moment from 'moment-timezone'

import knexfile from '../knexfile'

const knex = Knex(knexfile['production'])
moment.tz.setDefault('America/Chicago')

const run = async () => {
  await knex('workGroupSdcrDataPoints').delete()
  await knex('SdcrDataPoint').delete()
}
run()
