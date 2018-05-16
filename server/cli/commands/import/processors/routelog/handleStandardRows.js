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

const groupTypes = ['Company', 'Subcontractor', 'Division', 'DMA', 'Office', 'Service Region', 'Team', 'Tech']
const typeToIdProp = {
  Company: 'Partner Name',
  Subcontractor: 'Subcontractor',
  Division: 'Division',
  DMA: 'DMA',
  Office: 'Office',
  'Service Region': 'Service Region',
  Team: 'Tech Team',
  Tech: 'Tech ID',
}
const typeToNameProp = {
  Company: 'Partner Name',
  Subcontractor: 'Subcontractor',
  Division: 'Division',
  DMA: 'DMA',
  Office: 'Office',
  'Service Region': 'Service Region',
  Team: 'Tech Supervisor',
  Tech: 'Tech Name',
}

const workGroupCache = {}

export default async ({ knex, rows, now }) => {
  const { Appointment, Tech, Company, WorkGroup } = models
  const appointmentInserts = []
  const workGroupAppointmentsInserts = []

  await knex.transaction(async trx => {
    const companies = await Company.query(trx).eager('workGroups')
    companies.forEach(company => {
      company.workGroupsByType = _.groupBy(company.workGroups, 'type')
      company.workGroupIndex = _.mapValues(company.workGroupsByType, groups => _.keyBy(groups, 'externalId'))
    })
    const companiesByName = _.keyBy(companies, 'name')
    const techsByExternalId = _.keyBy(await Tech.query(trx), 'externalId')

    const srData = _.keyBy(
      await trx('directv_sr_data').select('Service Region', 'Office', 'DMA', 'Division'),
      'Service Region'
    )
    await Promise.resolve(rows).mapSeries(row => {
      const serviceRegion = row['Service Region']
      const srWorkGroupNames = srData[serviceRegion]
      const srGroupTypes = ['Division', 'DMA', 'Office', 'Service Region']
      srGroupTypes.forEach(type => {
        row[type] = srWorkGroupNames[type]
      })
      const rowHsp = companiesByName[row['Partner Name']]
      const rowCompanies = [rowHsp]
      if (row['Subcontractor']) {
        const rowSubcontractor = companiesByName[row['Subcontractor']]
        rowCompanies.push(rowSubcontractor)
      }
      return Promise.map(rowCompanies, company =>
        Promise.map(groupTypes, type => {
          const externalId = row[typeToIdProp[type]]
          const name = row[typeToNameProp[type]]
          return (
            name &&
            externalId &&
            WorkGroup.query(trx).ensure(
              {
                companyId: company.id,
                type,
                externalId,
                name,
              },
              workGroupCache
            )
          )
        })
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

        const tech = techsByExternalId[row['Tech ID']]

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
          techId: tech && tech.id,
          workOrderId: (appointment && appointment.workOrderId) || undefined,
        }

        appointmentInserts.push(newAppointment)

        const getWorkGroupsForCompany = company =>
          _.filter(
            groupTypes.map(type => {
              const externalId = row[typeToIdProp[type]]
              return company.workGroupIndex[type][externalId]
            })
          )
        const rowHsp = companiesByName[row['Partner Name']]
        const rowSubcontractor = row['Subcontractor'] && companiesByName[row['Subcontractor']]
        const hspWorkGroups = getWorkGroupsForCompany(rowHsp)
        const subcontractorWorkGroups = !rowSubcontractor ? [] : getWorkGroupsForCompany(rowSubcontractor)
        const workGroups = hspWorkGroups.concat(subcontractorWorkGroups)

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
  console.log(`${appointmentInserts.length} appointments created`)
}
