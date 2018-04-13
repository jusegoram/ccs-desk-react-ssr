import _ from 'lodash'
import Promise from 'bluebird'
import sanitizeName from 'server/util/sanitizeName'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import moment from 'moment-timezone'
import { streamToArray } from 'server/util'

const serviceW2Company = {
  'Goodman Analytics': 'Goodman',
  'DirectSat Analytics': 'DirectSat',
}

/* Sample Row Data:
  // { Region: 'AREA01',
  //   DMA: 'HOUSTON TX 1',
  //   Office: 'HOUSTON CENTRAL',
  //   'Service Region': 'TX05',
  //   'Tech Team Supervisor Login': 'MBTX033910',
  //   'Team ID': 'MB000661',
  //   'Team Name': 'JUSTIN JOHNSON',
  //   'Team Email': 'JJOHNSON@goodmannetworks.com',
  //   'Tech User ID': 'MBTX053759',
  //   'Tech ATT UID': 'MC170S',
  //   'Tech Full Name': 'CANDIA, MIGUEL',
  //   'Tech Type': 'Goodman',
  //   'Tech Team Supervisor Mobile #': '8325974061',
  //   'Tech Mobile Phone #': '8325645155',
  //   'Tech Schedule': 'WG 8-6 S Th off',
  //   'Tech Efficiency': '1.2',
  //   'Skill Package': 'INSTALL UPGRADE SERVICE - COMM MDU WB NC ROLLBACK FW',
  //   'Max Travel Miles': '15',
  //   'Start State': 'TX',
  //   'Start City': 'CLEVELAND',
  //   'Start Street': '188 COUNTY RD 2800',
  //   'Start Zip': '77327',
  //   'Start Latitude': '30315160',
  //   'Start Longitude': '-94937570',
  //   'End of Day State': '',
  //   'End of Day City': '',
  //   'End of Day Street': '',
  //   'End of Day Zip': '',
  //   'End of Day Latitude': '0',
  //   'End of Day Longitude': '0' }
*/

export default async ({ csvObjStream, dataSource }) => {
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { WorkGroup, Company, Employee, Geography } = models
    let srData = null

    const allEmployeeExternalIds = []

    const w2CompanyName = serviceW2Company[dataSource.service]
    srData = _.keyBy(
      await WorkGroup.knex()
      .select('Service Region', 'Office', 'DMA', 'Division')
      .from('directv_sr_data')
      .where({ HSP: w2CompanyName }),
      'Service Region'
    )

    const w2Company = await Company.query().ensure(w2CompanyName)

    const techDatas = await streamToArray(csvObjStream, data => {
      if (data['Tech Type'] === 'W2' || !data['Tech Type']) data['Tech Type'] = w2CompanyName
      data.Company = data['Tech Type']
      if (data.Company !== w2CompanyName || !data['Team ID'] || data['Team ID'] === 'UNKNOWN') delete data['Team ID']
      data.Team = data['Team ID']
      data.Tech = data['Tech User ID']
      return data
    })

    const techDatasByCompany = _.groupBy(techDatas, 'Tech Type')
    await Promise.mapSeries(Object.keys(techDatasByCompany), async companyName => {
      const company = await Company.query().ensure(companyName)

      const companyId = company.id

      const companyTechDatas = techDatasByCompany[companyName]
      await Promise.mapSeries(companyTechDatas, async techData => {
        const latitude = techData['Start Latitude'] / 1000000 || null
        const longitude = techData['Start Longitude'] / 1000000 || null
        const startLocation =
          latitude &&
          longitude &&
          (await Geography.query().upsert({
            query: { type: 'Start Location', latitude, longitude },
            update: { latitude }, //update can't be empty
          }))
        // find timezone based on start location
        const timezone = startLocation && (await startLocation.getTimezone())

        const employee = await Employee.query().upsert({
          query: { companyId, externalId: techData['Tech User ID'] },
          update: {
            dataSourceId: dataSource.id,
            terminatedAt: null,
            name: sanitizeName(techData['Tech Full Name']),
            phoneNumber: techData['Tech Mobile Phone #'],
            skills: techData['Skill Package'],
            schedule: techData['Tech Schedule'],
            timezone,
            startLocationId: startLocation && startLocation.id,
          },
        })
        const supervisor = await Employee.query().upsert({
          query: { companyId, externalId: techData['Tech Team Supervisor Login'] },
          update: {
            role: 'Manager',
            name: sanitizeName(techData['Team Name']),
            phoneNumber: techData['Tech Team Supervisor Mobile #'],
            dataSourceId: dataSource.id,
            terminatedAt: null,
            timezone,
          },
        })

        allEmployeeExternalIds.push(employee.externalId)
        const techSR = techData['Service Region']
        const techSrData = srData[techSR]

        const techWorkGroups = await Promise.props({
          tech: WorkGroup.query().ensure({
            w2Company,
            type: 'Tech',
            companyId: w2Company.id,
            externalId: employee.externalId,
            name: employee.name,
          }),
          team: WorkGroup.query().ensure({
            w2Company,
            type: 'Team',
            companyId: w2Company.id,
            externalId: techData['Team ID'],
            name: techData['Team ID'],
          }),
          w2Company: WorkGroup.query().ensure({
            w2Company,
            type: 'Company',
            companyId: w2Company.id,
            externalId: w2Company.name,
            name: w2Company.name,
          }),
          company: WorkGroup.query().ensure({
            w2Company,
            type: 'Company',
            companyId,
            externalId: company.name,
            name: company.name,
          }),
          ...(!!techSrData && {
            serviceRegion: WorkGroup.query().ensure({
              w2Company,
              type: 'Service Region',
              companyId: w2Company.id,
              externalId: techSR,
              name: techSR,
            }),
            office: WorkGroup.query().ensure({
              w2Company,
              type: 'Office',
              companyId: w2Company.id,
              externalId: techSrData['Office'],
              name: techSrData['Office'],
            }),
            dma: WorkGroup.query().ensure({
              w2Company,
              type: 'DMA',
              companyId: w2Company.id,
              externalId: techSrData['DMA'],
              name: techSrData['DMA'],
            }),
            division: WorkGroup.query().ensure({
              w2Company,
              type: 'Division',
              companyId: w2Company.id,
              externalId: techSrData['Division'],
              name: techSrData['Division'],
            }),
          }),
        })

        await employee.removeFromAllWorkGroups()
        await employee.$query().patch({ workGroupId: techWorkGroups.tech.id })
        await Promise.map(_.uniqBy(_.values(techWorkGroups), 'id'), workGroup => workGroup.addTech(employee))
        await techWorkGroups.team.addManager(supervisor)
      })
      await Employee.query()
      .where({ dataSourceId: dataSource.id, role: 'Tech' })
      .whereNotIn('externalId', allEmployeeExternalIds)
      .patch({ terminatedAt: moment.utc().format() })
    })
  })
}
