import { Model } from 'objection'
import knex from 'server/knex'
import * as models from 'server/api/models'
import _ from 'lodash'
import stringify from 'csv-stringify'
import express from 'express'

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  if (!req.session) return res.sendStatus(401)

  const { session, moment } = req
  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': 'attachment; filename=Techs.csv',
  })

  const knex = Tech.knex()
  const companyWorkGroupIds = knex('WorkGroup')
  .select('id')
  .where({ companyId: session.account.company.id })
  const visibleTechIds = knex('workGroupTechs')
  .select('techId')
  .whereIn('workGroupId', companyWorkGroupIds)
  const stringifier = stringify({ header: true })
  await models.Tech.query()
  .whereIn('id', visibleTechIds)
  .map(async tech => _.mapValues(tech, val => (val === true ? 'TRUE' : val === false ? 'FALSE' : val)))
  .map(tech => {
    stringifier.write(tech.row)
  })
  stringifier.end()

  stringifier.pipe(res)
})

export default router
