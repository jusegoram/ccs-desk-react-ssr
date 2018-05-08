import { Model } from 'objection'
import knex from 'server/knex'
import { SdcrDataPoint, WorkGroup } from 'server/api/models'
import _ from 'lodash'
import Promise from 'bluebird'

import express from 'express'

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  const { session } = req
  if (!session) return res.sendStatus(401)
  const { type } = req.query
  const query = WorkGroup.query()
  .distinct('name')
  .where('type', type)
  if (session.account.company.name !== 'CCS') {
    query.where('companyId', session.account.company.id)
  }
  res.json(await query)
})

export default router
