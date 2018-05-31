import _ from 'lodash'
import { transaction, raw } from 'objection'
import * as rawModels from 'server/api/models'
import { streamToArray } from 'server/util'
import Timer from 'server/util/Timer'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import sanitizeCompanyName from 'server/cli/commands/import/processors/sanitizeCompanyName'
import uuid from 'uuid/v4'

class ExpectedError extends Error {}

export default async ({ csvObjStream, w2Company, now }) => {
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { Tech, Company, Appointment, SdcrDataPoint } = models
    const knex = Appointment.knex()

    const companies = await Company.query().eager('workGroups')
    companies.forEach(company => {
      company.workGroupsByType = _.groupBy(company.workGroups, 'type')
      company.workGroupIndex = _.mapValues(company.workGroupsByType, groups => _.keyBy(groups, 'externalId'))
    })
    const companiesByName = _.keyBy(companies, 'name')
    w2Company = companiesByName[w2Company.name]
    const techsByExternalId = _.keyBy(await Tech.query(knex).eager('workGroups'), 'externalId')

    const srData = _.keyBy(
      await knex('directv_sr_data').select('Service Region', 'Office', 'DMA', 'Division'),
      'Service Region'
    )

    const reportWindowStart = moment(now)
    .add(-2, 'days')
    .startOf('month')
    .format()
    const reportWindowEnd = moment(now)
    .add(-2, 'days')
    .endOf('month')
    .format()
    await SdcrDataPoint.query()
    .where('date', '>=', reportWindowStart)
    .where('date', '<=', reportWindowEnd)
    .whereRaw("row->>'Company' = ?", [w2Company.name])
    .delete()

    const rows = await streamToArray(csvObjStream)
    let invalidRowsDetected = []
    console.log(`${rows.length} rows to process`)
    let index = 0
    const sdcrDataPointInserts = []
    const workGroupSdcrDataPointsInserts = []
    await Promise.map(
      rows,
      async row => {
        index++
        if (!(index % 1000)) console.log(index / 1000)

        try {
          const externalId = row['Activity ID']
          if (row['Subcontractor Company Name'] === 'UNKNOWN') delete row['Subcontractor Company Name']
          const subcontractorName = sanitizeCompanyName(row['Subcontractor Company Name'])
          const subcontractor = subcontractorName && companiesByName[subcontractorName]

          const tech = await (async () => {
            if (
              row['Activity Status (Snapshot)'] === 'Closed' ||
              row['Activity Status (Snapshot)'] === 'Pending Closed'
            ) {
              const tech = techsByExternalId[row['Tech ID']]
              return tech || null
            }
            const bgoSnapshotDate = moment.tz(row['BGO Snapshot Date'], 'YYYY-MM-DD', 'America/Chicago')
            const rangeStart = bgoSnapshotDate.clone().startOf('day')
            const rangeEnd = bgoSnapshotDate.clone().endOf('day')
            const appointment = await Appointment.query()
            .eager('assignedTech.workGroups')
            .findOne(
              raw('lifespan && tstzrange(?, ?, \'[)\') and "externalId" = ?', [rangeStart, rangeEnd, externalId])
            )
            .orderBy('createdAt', 'desc')
            .whereNotNull('techId')
            const tech = appointment && appointment.assignedTech
            return tech || null
          })()

          const sdcrWorkGroups = (() => {
            const srWorkGroupTypes = ['Service Region', 'DMA', 'Office', 'Division']
            const workGroupExternalIds = srData[row['Service Region']]
            const srWorkGroups = []
            srWorkGroupTypes.forEach(type => {
              const externalId = workGroupExternalIds[type]
              srWorkGroups.push(w2Company.workGroupIndex[type][externalId])
              if (subcontractor) srWorkGroups.push(subcontractor.workGroupIndex[type][externalId])
            })
            const techWorkGroups = !tech
              ? []
              : _.filter(tech.workGroups, workGroup => !_.includes(srWorkGroupTypes, workGroup.type))
            return srWorkGroups.concat(techWorkGroups)
          })()

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
          row['Tech ID'] = tech ? tech.externalId : ''
          const teamGroup = _.find(sdcrWorkGroups, { type: 'Team' })
          row['Team Name'] = teamGroup ? teamGroup.name : ''
          sdcrWorkGroups.forEach(workGroup => {
            row[workGroup.type] = workGroup.externalId
          })
          const sdcrDataPointId = uuid()
          const existing = await SdcrDataPoint.query().findOne({
            date: row['BGO Snapshot Date'],
            externalId: row['Activity ID'],
          })
          const sdcrDataPoint =
            existing ||
            (await SdcrDataPoint.query()
            .insert({
              id: sdcrDataPointId,
              value: row['# of Same Day Activity Closed Count'] === '1' ? 1 : 0,
              date: row['BGO Snapshot Date'],
              externalId: row['Activity ID'],
              techId: tech ? tech.id : null,
              type: row['Activity Sub Type (Snapshot)'],
              dwellingType: row['Dwelling Type'],
              row: row,
            })
            .returning('*'))
          workGroupSdcrDataPointsInserts.push(
            ...sdcrWorkGroups.map(workGroup => ({
              workGroupId: workGroup.id,
              sdcrDataPointId: sdcrDataPoint.id,
            }))
          )
        } catch (e) {
          if (!(e instanceof ExpectedError)) {
            console.log(row)
            // throw e
          }
          invalidRowsDetected.push({
            failureReason: e.message,
            ...row,
          })
        }
      },
      { concurrency: 200 }
    )

    await knex.batchInsert('workGroupSdcrDataPoints', workGroupSdcrDataPointsInserts).transacting(knex)

    if (invalidRowsDetected.length) {
      console.log('invalid row detected')
      console.log(invalidRowsDetected)
      // TODO: Email Tim - attach Sclosed csv
    }
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
