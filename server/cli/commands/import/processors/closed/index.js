import _ from 'lodash'
import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import { streamToArray } from 'server/util'
import Timer from 'server/util/Timer'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import Company from 'server/api/models/Company'
import WorkGroup from 'server/api/models/WorkGroup'

export default async ({ csvObjStream }) => {
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { Tech, WorkOrder, SdcrDataPoint } = models

    const rows = await streamToArray(csvObjStream)
    let invalidRowsDetected = []
    const sdcrData = []
    console.log(`${rows.length} rows to process`)
    let index = 0
    await Promise.mapSeries(rows, async row => {
      index++
      if (!(index % 1000)) console.log(index / 1000)
      let tech = null
      const workOrder = await WorkOrder.query().findOne({ externalId: row['Activity ID'] })
      if (row['Activity Status (Snapshot)'] === 'Closed' || row['Activity Status (Snapshot)'] === 'Pending Closed') {
        tech = await Tech.query().findOne({ externalId: row['Tech ID'] })
      } else {
        const appointment =
          workOrder &&
          (await workOrder
          .$relatedQuery('appointments')
          .where(
            'createdAt',
            '<=',
            moment(row['BGO Snapshot Date'], 'YYYY-MM-DD')
            .endOf('day')
            .format()
          )
          .orderBy('createdAt', 'desc')
          .first())
        if (!appointment || !appointment.row) {
          invalidRowsDetected.push(row)
          return
        }
        const techId = appointment && appointment.row['Tech ID']
        tech = techId && (await Tech.query().findOne({ externalId: techId }))
        if (!tech) {
          tech = await Tech.query().findOne({ externalId: row['Tech ID'] })
        }
      }

      if (!tech) {
        invalidRowsDetected.push(row)
        return
      }

      const serviceRegionWorkGroups = ['Service Region', 'DMA', 'Office', 'Division']
      const techGroups = await tech.$relatedQuery('workGroups').whereNotIn('type', serviceRegionWorkGroups)
      let workOrderGroups = null
      if (workOrder) {
        workOrderGroups = await workOrder.$relatedQuery('workGroups').whereIn('type', serviceRegionWorkGroups)
      } else {
        const serviceRegionWorkGroupNames = await WorkGroup.knex()('directv_sr_data')
        .where({
          'Service Region': row['Service Region'],
        })
        .first()
        const techCompanyWorkGroupIds = await tech
        .$relatedQuery('workGroups')
        .select('id')
        .whereIn('type', ['Company', 'Subcontractor'])
        const techCompanyIds = await WorkGroup.knex()('Company')
        .select('id')
        .whereIn('workGroupId', _.map(techCompanyWorkGroupIds, 'id'))
        workOrderGroups = await WorkGroup.query()
        .whereIn('companyId', _.map(techCompanyIds, 'id'))
        .where(qb => {
          qb
          .where({
            type: 'Service Region',
            name: serviceRegionWorkGroupNames['Service Region'],
          })
          .orWhere({
            type: 'Office',
            name: serviceRegionWorkGroupNames['Office'],
          })
          .orWhere({
            type: 'DMA',
            name: serviceRegionWorkGroupNames['DMA'],
          })
          .orWhere({
            type: 'Division',
            name: serviceRegionWorkGroupNames['Division'],
          })
        })
      }
      const sdcrWorkGroups = techGroups.concat(workOrderGroups)
      await SdcrDataPoint.query()
      .where({
        workOrderExternalId: row['Activity ID'],
        date: row['BGO Snapshot Date'],
      })
      .delete()

      const badProps = [
        'HSP Partner Name',
        'DMA',
        'Office',
        'Service Region',
        'Tech Team',
        'Tech ID',
        'Tech Name',
        'Subcontractor',
        'Company Name',
      ]
      badProps.forEach(prop => {
        delete row[prop]
      })
      row['Tech ID'] = tech.externalId
      row['Tech Name'] = tech.name
      const teamGroup = _.find(sdcrWorkGroups, { type: 'Team' })
      row['Team Name'] = teamGroup && teamGroup.name
      sdcrWorkGroups.forEach(workGroup => {
        row[workGroup.type] = workGroup.externalId
      })

      const sdcrDataPoint = await SdcrDataPoint.query().insert({
        value: row['# of Same Day Activity Closed Count'] === '1' ? 1 : 0,
        date: row['BGO Snapshot Date'],
        workOrderId: workOrder && workOrder.id,
        techId: tech.id,
        workOrderExternalId: row['Activity ID'],
        type: row['Activity Sub Type (Snapshot)'],
        dwellingType: row['Dwelling Type'],
        row: row,
      })
      await sdcrDataPoint.$relatedQuery('workGroups').relate(sdcrWorkGroups)
    })

    if (invalidRowsDetected.length) {
      console.log('invalid row detected')
      console.log(invalidRowsDetected)
      // TODO: Email Tim - attach Sclosed csv
    }
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
