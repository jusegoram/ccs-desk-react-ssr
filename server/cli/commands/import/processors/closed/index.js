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
        workOrderGroups = await tech
        .$query()
        .joinRelation('workGroups.company.workGroups', {
          aliases: {
            company: 'c',
            workGroups: 'wg',
          },
        })
        .whereIn('wg.type', ['Company', 'Subcontractor'])
        .where({ 'wg:c:wg.type': 'Service Region', 'wg:c:wg.name': serviceRegionWorkGroupNames['Service Region'] })
        .orWhere({ 'wg:c:wg.type': 'Office', 'wg:c:wg.name': serviceRegionWorkGroupNames['Office'] })
        .orWhere({ 'wg:c:wg.type': 'DMA', 'wg:c:wg.name': serviceRegionWorkGroupNames['DMA'] })
        .orWhere({ 'wg:c:wg.type': 'Division', 'wg:c:wg.name': serviceRegionWorkGroupNames['Division'] })
      }
      const sdcrWorkGroups = techGroups.concat(workOrderGroups)
      sdcrWorkGroups.forEach(workGroup => {
        sdcrData.push({
          workGroupId: workGroup.id,
          value: row['# of Same Day Activity Closed Count'] === '1' ? 1 : 0,
          date: row['BGO Snapshot Date'],
          workOrderId: workOrder && workOrder.id,
          techId: tech.id,
        })
      })
    })

    const workOrdersIdsInQuestion = _.uniq(_.map(sdcrData, 'workOrderId'))
    await SdcrDataPoint.query()
    .whereIn('workOrderId', workOrdersIdsInQuestion)
    .delete()

    await Promise.map(
      sdcrData,
      async sdcrDatum => {
        await SdcrDataPoint.query().insert(sdcrDatum)
      },
      { concurrency: 100 }
    )
    if (invalidRowsDetected.length) {
      console.log('invalid row detected')
      console.log(invalidRowsDetected)
      // TODO: Email Tim - attach Sclosed csv
    }
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
