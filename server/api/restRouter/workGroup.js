import { Model } from 'objection'
import knex from 'server/knex'
import { SdcrDataPoint } from 'server/api/models'
import _ from 'lodash'
import Promise from 'bluebird'

import express from 'express'

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  const { session } = req
  if (!session) return res.sendStatus(401)
  const { type } = req.query
  res.json(
    await session.account.company
    .$relatedQuery('workGroups')
    .distinct('name')
    .where('type', type)
    .where('companyId', session.account.company.id)
  )
})

export default router
