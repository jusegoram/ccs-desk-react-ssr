import { Model } from 'objection'
import knex from 'server/knex'
import { SdcrDataPoint } from 'server/api/models'
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
  let { dateRange, scopeType, scopeName, groupType } = req.query
  if (!scopeType || !scopeName || !groupType || !dateRange) return res.json([])

  const query = SdcrDataPoint.query()
  .joinRelation('workGroups')
  .where('date', '>=', dateRange.start)
  .where('date', '<=', dateRange.end)
  .where('workGroups.type', scopeType)
  .where('workGroups.name', scopeName)
  if (session.account.company.name !== 'CCS') {
    query.where('workGroups.companyId', session.account.company.id)
  }
  query.eager('workGroups').modifyEager('workGroups', builder => {
    builder.where('type', groupType)
    if (session.account.company.name !== 'CCS') {
      builder.where('companyId', session.account.company.id)
    }
  })
  const sdcrDataPoints = await query

  const sdcr = _.map(_.values(_.groupBy(sdcrDataPoints, 'workGroups[0].externalId')), dataPointsGroup => {
    const size = dataPointsGroup.length
    const value = _.sum(_.map(dataPointsGroup, 'value'))
    const color = colorMap({ value: 100 * value / (size || 1) })
    const undefinedWorkgroupName = groupType === 'Subcontractor' ? 'W2' : 'N/A'
    const workGroupName = dataPointsGroup[0].workGroups[0]
      ? dataPointsGroup[0].workGroups[0].name
      : undefinedWorkgroupName
    const name = workGroupName + ' (' + (100 * value / (size || 1)).toFixed(2) + '%)'
    return { size, value, color, name }
  })
  res.json({
    children: sdcr,
  })
})

export default router
