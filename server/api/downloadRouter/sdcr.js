import { Model, raw } from 'objection'
import knex from 'server/knex'
import * as models from 'server/api/models'
import _ from 'lodash'
import stringify from 'csv-stringify'
import express from 'express'
import Tech from 'server/api/models/Tech'
import SdcrDataPoint from 'server/api/models/SdcrDataPoint'

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  const { session } = req
  if (!session) return res.sendStatus(401)
  let { dateRange, scopeType, scopeName, groupType, workOrderType } = req.query
  console.log(req.query)
  if (!scopeType || !scopeName || !groupType || !dateRange || !workOrderType) return res.sendStatus(422)

  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': 'attachment; filename=SDCR.csv',
  })
  const stringifier = stringify({ header: true })

  await knex
  .raw(
    `
    with sdcr_data as (
      SELECT "workGroupId", row
      FROM "SdcrDataPoint" 
      left join "sdcrDataPointWorkGroups" on "sdcrDataPointWorkGroups"."sdcrDataPointId" = "SdcrDataPoint".id 
      group by "workGroupId", "row"
    )
    select row
    from sdcr_data left 
    join "WorkGroup" on "workGroupId" = "WorkGroup".id 
    left join "Company" on "companyId" = "Company".id 
    where "companyId" = ?
    order by "Company".id, "WorkGroup".order;
  `,
    [session.account.company.id]
  )
  .get('rows')
  .map(sdcrDataPoint => {
    stringifier.write(sdcrDataPoint)
  })
  stringifier.end()
  stringifier.pipe(res)
})

export default router
