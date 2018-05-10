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
    with scope as (
      select "sdcrDataPointWorkGroups"."sdcrDataPointId"
      from "WorkGroup" 
      left join "sdcrDataPointWorkGroups" on "sdcrDataPointWorkGroups"."workGroupId" = "WorkGroup".id
      where "WorkGroup"."companyId" = ?
    )
    select row
    from "SdcrDataPoint"
    where id in scope
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
