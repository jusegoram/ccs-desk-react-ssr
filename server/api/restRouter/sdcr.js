import { Model } from 'objection'
import knex from 'server/knex'
import { WorkGroup } from 'server/api/models'
import _ from 'lodash'
import Promise from 'bluebird'

import express from 'express'

const d3 = require('d3')

const badColor_prod = d3
.scaleLinear()
.domain([0, 48, 68])
.range(['#ff0000', '#ff0000', '#660000'])

// dark blue -> light blue
const neutralColor_prod = d3
.scaleLinear()
.domain([68, 75])
.range(['#cc6500', '#ffd400'])

// dark green -> light green
const goodColor_prod = d3
.scaleLinear()
.domain([75, 85, 100])
.range(['#408000', '#0c22a6', '#0c22a6'])

const colorMap = function(d) {
  if (!d) {
    return '#ccc'
  } else if (d.value < 68) {
    return badColor_prod(d.value)
  } else if (d.value < 75) {
    return neutralColor_prod(d.value)
  } else {
    return goodColor_prod(d.value)
  }
}

Model.knex(knex)

const router = express.Router()

router.get('/', async (req, res) => {
  const { session } = req
  if (!session) return res.sendStatus(401)
  req.query.dateRange = JSON.parse(req.query.dateRange)
  const { dateRange, scopeType, scopeName, groupType } = req.query
  const sdcr = await Promise.mapSeries(
    await session.account.company.$relatedQuery('workGroups').where('type', groupType),
    async workGroup => {
      console.log('WORK GORU', workGroup)
      console.log(
        'sdcrs',
        await WorkGroup.query()
        .where('WorkGroup.id', workGroup.id)
        .joinRelation('sdcrDataPoints.workGroups.sdcrDataPoints')
        .select('sdcrDataPoints:workGroups:sdcrDataPoints.*')
        .where('sdcrDataPoints:workGroups.type', scopeType)
        .where('sdcrDataPoints:workGroups.name', scopeName)
      )
      const sdcrDataPoints = await workGroup
      .$relatedQuery('sdcrDataPoints')
      .select('SdcrDataPoint.*')
      .joinRelation('workGroups')
      .where('workGroups.type', scopeType)
      .where('workGroups.name', scopeName)
      .where('date', '>=', dateRange.start)
      .where('date', '<=', dateRange.end)
      const size = sdcrDataPoints.length
      const value = _.sum(_.map(sdcrDataPoints, 'value'))
      const color = colorMap({ value })
      const name = workGroup.name
      return { size, value, color, name }
    }
  )
  console.log('scopeType', scopeType)
  console.log('scopeName', scopeName)
  // console.log(await session.account.company.$relatedQuery('workGroups').where('type', groupType))
  // console.log(sdcr)
  res.json({
    children: sdcr,
  })
})

export default router
