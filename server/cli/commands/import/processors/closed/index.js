import _ from 'lodash'
import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import { streamToArray } from 'server/util'
import Timer from 'server/util/Timer'
import Promise from 'bluebird'
import moment from 'moment-timezone'

export default async ({ csvObjStream }) => {
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { Tech, WorkOrder, SdcrDataPoint } = models

    const rows = await streamToArray(csvObjStream)
    let invalidRowDetected = false
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
          .where('createdAt', '<=', row['BGO Snapshot Date'])
          .orderBy('createdAt', 'desc')
          .first())
        const techId = appointment && appointment.row['Tech ID']
        tech = techId && (await Tech.query().findOne({ externalId: techId }))
        if (!tech) {
          tech = await Tech.query().findOne({ externalId: row['Tech ID'] })
        }
      }

      if (!tech || !workOrder) {
        invalidRowDetected = row
        console.log('invalid row:')
        console.log(row)
        return
      }

      const serviceRegionWorkGroups = ['Service Region', 'DMA', 'Office', 'Division']
      await tech.$loadRelated('workGroups').whereNotIn('type', serviceRegionWorkGroups)
      await workOrder.$loadRelated('workGroups').whereIn('type', serviceRegionWorkGroups)
      const sdcrWorkGroups = tech.workGroups.concat(workOrder.workGroups)
      sdcrWorkGroups.forEach(workGroup => {
        sdcrData.push({
          workGroupId: workGroup.id,
          value: row['# of Same Day Activity Closed Count'],
          date: moment(row['BGO Snapshot Date']).format(),
          workOrderId: workOrder.id,
          techId: tech.id,
        })
      })
    })

    await Promise.mapSeries(_.values(sdcrData), async sdcrDatum => {
      await SdcrDataPoint.query().upsert({
        query: { workGroupId: sdcrDatum.workGroupId, date: sdcrDatum.date },
        update: {
          value: sdcrDatum.value,
          workOrderId: sdcrDatum.workOrderId,
          techId: sdcrDatum.techId,
        },
      })
    })
    if (invalidRowDetected) {
      console.log('invalid row detected')
      console.log(invalidRowDetected)
      // TODO: Email Tim - attach Sclosed csv
    }
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
