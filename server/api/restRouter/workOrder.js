import { Model } from 'objection'
import knex from 'server/knex'
import { WorkOrder } from 'server/api/models'
import _ from 'lodash'

import express from 'express'

Model.knex(knex)

const router = express.Router()

const colors = {
  Service: '#B3AD9E',
  Rollback: '#12939A',
  Upgrade: '#79C7E3',
  'Former Install': '#1A3177',
  'New Install': '#FF9833',
  'NC Rollback': '#EF5D28',
}
const statusColors = {
  'Customer Unscheduled': '#19CDD7',
  'On Site': '#DDB27C',
  Cancelled: '#88572C',
  Dispatched: '#FF991F',
  Scheduled: '#F15C17',
  Hold: '#223F9A',
  'Past Open': '#DA70BF',
  'Pending Closed': '#125C77',
  Closed: '#4DC19C',
  Unscheduled: '#776E57',
  Acknowledged: '#12939A',
  'En Route with ETA': '#17B8BE',
}

router.get('/meta', async (req, res) => {
  const { session } = req
  if (!session) return res.sendStatus(401)
  try {
    const knex = WorkOrder.knex()
    const visibleWorkGroupIds = knex('WorkGroup')
    .select('id')
    .where('companyId', session.account.company.id)
    const visibleWorkOrderIds = knex('workGroupWorkOrders')
    .select('workOrderId')
    .whereIn('workGroupId', visibleWorkGroupIds)
    const rawWorkOrderStats = await knex('WorkOrder')
    .whereIn('id', visibleWorkOrderIds)
    .select(knex.raw("row->>'Source' as source"), 'type', 'status')
    .count()
    .where('date', req.query.date)
    .groupByRaw("row->>'Source', type, status")
    .orderBy('type', 'status')
    .map(data => {
      data.count = parseInt(data.count)
      return data
    })
    .map(data => ({
      ...data,
      name: data.status,
      value: data.count,
      hex: statusColors[data.status],
    }))
    const repairs = _.filter(rawWorkOrderStats, { source: 'Siebel' })
    const repairsByType = _.sortBy(
      _.values(
        _.mapValues(_.groupBy(repairs, 'type'), (group, groupName) => ({
          name: groupName,
          label: groupName,
          hex: colors[groupName],
          children: group,
          value: _.sumBy(group, 'value'),
        }))
      ),
      'name'
    )
    const production = _.difference(rawWorkOrderStats, repairs)
    const productionByType = _.sortBy(
      _.values(
        _.mapValues(_.groupBy(production, 'type'), (group, groupName) => ({
          name: groupName,
          label: groupName,
          hex: colors[groupName],
          children: group,
          value: _.sumBy(group, 'value'),
        }))
      ),
      'name'
    )
    const topLevelGroups = [
      {
        name: 'Siebel',
        label: 'Siebel',
        hex: '#F6D18A',
        value: _.sumBy(repairsByType, 'value'),
        children: repairsByType,
      },
      {
        name: 'Edge',
        label: 'Edge',
        hex: '#F89570',
        value: _.sumBy(productionByType, 'value'),
        children: productionByType,
      },
    ]
    const workOrderStats = {
      name: 'Work Orders',
      value: _.sumBy(topLevelGroups, 'value'),
      children: topLevelGroups,
    }
    res.json(workOrderStats)
  } catch (e) {
    if (!res.headersSent) {
      res.sendStatus(422)
    }
    throw e
  }
})

export default router
