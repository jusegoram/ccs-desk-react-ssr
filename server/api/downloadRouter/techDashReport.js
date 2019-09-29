import { Model } from 'objection'
import knex from 'server/knex'
import {TechDashConsumerElectronics, TechDashUpSell} from 'server/api/models'
import _ from 'lodash'
import stringify from 'csv-stringify'
import express from 'express'
import moment from 'moment-timezone'

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  const { session } = req
  if (!session) return res.sendStatus(401)
  const params = req.query
  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': 'attachment; filename=EOD-TechDashReport.csv',
  })

  const stringifier = stringify({ header: true })


  const endOfQueryDate = moment(params.endDate, 'YYYY-MM-DD')
  .endOf('day')
  .format()

  const startOfQueryDate = moment(params.startDate, 'YYYY-MM-DD')
  .startOf('day')
  .format()
  if (params.type === 'CE') {
    const result = await TechDashConsumerElectronics.query()
    .where('dmaEmail', params.dmaEmail)
    .where('createdAt', '>', startOfQueryDate)
    .where('createdAt', '<', endOfQueryDate)
    result.map(i => {
      stringifier.write(i)
    })
    stringifier.end()

    stringifier.pipe(res)
  } else if (params.type === 'UPSELL') {
    const result = await TechDashUpSell.query()
    .where('dmaEmail', params.dmaEmail)
    .where('createdAt', '>', startOfQueryDate)
    .where('createdAt', '<', endOfQueryDate)
    result.map(i => {
      stringifier.write(i)
    })
    stringifier.end()

    stringifier.pipe(res)
  }
})

export default router
