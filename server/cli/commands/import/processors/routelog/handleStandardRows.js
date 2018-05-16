import _ from 'lodash'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import * as models from 'server/api/models'
import uuid from 'uuid/v4'

// Standard Row Props
//   Source
//   Partner Name
//   Subcontractor - TBD
//   Activity ID
//   Tech ID
//   Tech Name - TBD
//   Team ID - TBD
//   Team Name - TBD
//   Service Region
//   Office - TBD
//   DMA - TBD
//   Division - TBD
//   Order Type
//   Status
//   Reason Code
//   Time Zone
//   Created Date
//   Due Date
//   Planned Start Date
//   Actual Start Date
//   Actual End Date
//   Cancelled Date
//   Negative Reschedules
//   Planned Duration
//   Actual Duration
//   Service in 7 Days
//   Repeat Service
//   Internet Connectivity
//   Customer ID
//   Customer Name
//   Customer Phone
//   Dwelling Type
//   Address
//   Zipcode
//   City
//   State
//   Latitude
//   Longitude

const getDateString = timeString => {
  if (!timeString) return null
  const badDateString = timeString.split(' ')[0]
  let date = moment(badDateString, 'M/D/YY')
  if (!date.isValid()) date = moment(badDateString, 'YYYY-MM-DD')
  if (!date.isValid()) return null
  return date.format('YYYY-MM-DD')
}

const workGroupCache = {}

export default async ({ knex, rows, now }) => {
  const { Appointment, Tech, Company, WorkGroup } = models
  const badRows = []
  const appointmentInserts = []
  const workGroupAppointmentsInserts = []

  await knex.transaction(async trx => {
    const companies = await Company.query(trx).eager('workGroups')
    const companiesByWorkGroupId = _.keyBy(companies, 'workGroupId')

    const techs = await Tech.query(trx)
    .eager('workGroups')
    .map(tech => {
      const techCompanyWorkGroup = _.find(tech.workGroups, workGroup => {
        return workGroup.type === 'Company' && companiesByWorkGroupId[workGroup.id]
      })
      const techSubcontractorWorkGroup = _.find(tech.workGroups, workGroup => {
        return workGroup.type === 'Subcontractor' && companiesByWorkGroupId[workGroup.id]
      })
      const hsp = companiesByWorkGroupId[techCompanyWorkGroup.id]
      if (!hsp) {
        throw new Error('Tech company not found')
      }
      const subcontractor = techSubcontractorWorkGroup && companiesByWorkGroupId[techSubcontractorWorkGroup.id]
      const companies = [hsp]
      if (subcontractor) companies.push(subcontractor)
      return {
        ...tech,
        hsp,
        subcontractor,
        companies,
      }
    })
    const techsById = _.keyBy(techs, 'externalId')

    const srData = _.keyBy(
      await trx('directv_sr_data').select('Service Region', 'Office', 'DMA', 'Division'),
      'Service Region'
    )
    await Promise.resolve(rows).mapSeries(row => {
      const tech = techsById[row['Tech ID']]
      if (!tech) return
      const serviceRegion = row['Service Region']
      const srWorkGroupNames = srData[serviceRegion]
      return Promise.map(tech.companies, company =>
        Promise.all(
          ['Division', 'DMA', 'Office', 'Service Region'].map(type =>
            WorkGroup.query(trx).ensure(
              {
                companyId: company.id,
                type,
                externalId: srWorkGroupNames[type],
                name: srWorkGroupNames[type],
              },
              workGroupCache
            )
          )
        )
      )
    })

    await Promise.map(companies, company => company.$loadRelated('workGroups'))

    await Promise.resolve(rows).map(
      async row => {
        let appointment = await Appointment.query(trx)
        .where({ externalId: row['Activity ID'] })
        .orderBy('createdAt', 'desc')
        .first()

        if (appointment && _.isEqual(appointment.row, row)) return

        const tech = techsById[row['Tech ID']]

        if (!tech) {
          row.failureReason = 'Tech not found'
          badRows.push(row)
          return
        }

        if (appointment) {
          await appointment.$query(trx).patch({
            lifespan: knex.raw("tstzrange(lower(lifespan), ?, '[)')", [now]),
            destroyedAt: now,
          })
        }

        const newAppointment = {
          id: uuid(),
          lifespan: knex.raw("tstzrange(?, null, '[)')", [now]),
          externalId: row['Activity ID'],
          dueDate: getDateString(row['Due Date']),
          type: row['Order Type'],
          status: row['Status'],
          row: row,
          createdAt: now,
          techId: tech.id,
          workOrderId: (appointment && appointment.workOrderId) || undefined,
        }

        appointmentInserts.push(newAppointment)

        const techWorkGroups = _.filter(tech.workGroups, workGroup =>
          _.includes(['Company', 'Subcontractor', 'Team', 'Tech'], workGroup.type)
        )
        const srWorkGroups = _.flatten(
          tech.companies.map(company => {
            return _.filter(company.workGroups, workGroup =>
              _.includes(['DMA', 'Division', 'Service Region', 'Office'], workGroup.type)
            )
          })
        )

        const workGroups = techWorkGroups.concat(srWorkGroups)

        workGroupAppointmentsInserts.push(
          ...workGroups.map(workGroup => ({
            workGroupId: workGroup.id,
            appointmentId: newAppointment.id,
          }))
        )
      },
      {
        concurrency: 100,
      }
    )

    await knex.batchInsert('Appointment', appointmentInserts).transacting(trx)
    await knex.batchInsert('workGroupAppointments', workGroupAppointmentsInserts).transacting(trx)
  })
  console.log(badRows)
  console.log(`${badRows.length} rows not processed`)
}
