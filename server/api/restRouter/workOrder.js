import { Model } from 'objection'
import knex from 'server/knex'
import { WorkOrder } from 'server/api/models'
import _ from 'lodash'

import express from 'express'

Model.knex(knex)

const router = express.Router()

const colors = {
  Service: '#EF5D28',
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
  const companyWorkGroup = await session.account.company.$relatedQuery('workGroup')
  let workOrders = null
  if (session.account.company.name === 'CCS') {
    workOrders = WorkOrder.query()
  } else {
    workOrders = companyWorkGroup.$relatedQuery('workOrders')
  }
  const rawWorkOrderStats = await workOrders
  .select('type', 'status')
  .count()
  .groupBy('type', 'status')
  .orderBy('type', 'status')
  .map(data => ({
    ...data,
    name: data.status,
    value: parseInt(data.count),
    hex: statusColors[data.status],
  }))
  const repairs = _.filter(rawWorkOrderStats, { type: 'Service' })
  const repairsByType = _.values(
    _.mapValues(_.groupBy(repairs, 'type'), (group, groupName) => ({
      name: groupName,
      hex: colors[groupName],
      children: group,
    }))
  )
  const production = _.difference(rawWorkOrderStats, repairs)
  const productionByType = _.values(
    _.mapValues(_.groupBy(production, 'type'), (group, groupName) => ({
      name: groupName,
      hex: colors[groupName],
      children: group,
    }))
  )
  const workOrderStats = {
    name: 'Work Orders',
    children: [
      { name: 'Repairs', hex: '#F6D18A', children: repairsByType },
      { name: 'Production', hex: '#F89570', children: productionByType },
    ],
  }
  res.json(workOrderStats)
})

export default router
