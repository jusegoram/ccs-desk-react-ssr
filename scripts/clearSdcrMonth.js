import Knex from 'knex'
import moment from 'moment-timezone'

import knexfile from '../knexfile'

const knex = Knex(knexfile['production'])
moment.tz.setDefault('America/Chicago')

const run = async () => {
  const sdcrIds = knex('SdcrDataPoint')
  .select('id')
  .where(
    'date',
    '>=',
    moment()
    .startOf('month')
    .format('YYYY-MM-DD')
  )
  .where(
    'date',
    '<=',
    moment()
    .endOf('month')
    .format('YYYY-MM-DD')
  )
  await knex('workGroupSdcrDataPoints')
  .whereIn('sdcrDataPointId', sdcrIds)
  .delete()
  await sdcrIds.delete()
}
run()
