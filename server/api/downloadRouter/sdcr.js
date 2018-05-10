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
    'Content-Disposition': 'attachment; filename=WorkOrders.csv',
  })
  const stringifier = stringify({ header: true })

  await knex
  .raw(
    `
    with sdcr_data as (
      SELECT "workGroupId", sum(value) as "numerator", count(*) as "denominator", sum(value)*1.0/count(*) as "sdcr" 
      FROM "SdcrDataPoint" 
      left join "sdcrDataPointWorkGroups" on "sdcrDataPointWorkGroups"."sdcrDataPointId" = "SdcrDataPoint".id 
      group by "workGroupId"
    )
    select "Company".name as "Company Name", type as "Work Group Type", "WorkGroup".name as "Work Group Name", "WorkGroup"."externalId" as "Work Group External ID", numerator, denominator, sdcr 
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
