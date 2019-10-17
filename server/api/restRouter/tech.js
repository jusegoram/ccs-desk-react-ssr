import { Model } from 'objection'
import knex from 'server/knex'
import * as models from 'server/api/models'
import _ from 'lodash'
import express from 'express'

Model.knex(knex)

const router = express.Router()

router.get('/:id/row', async (req, res) => {
    const {id} = req.params
    await models.Tech.query().select('row').where('id', id).then(result => {
      res.status(200).json(result[0])
    })
})

export default router