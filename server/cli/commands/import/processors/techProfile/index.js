import _ from 'lodash'
import Promise from 'bluebird'
import ObjectStreamTransform from 'server/cli/commands/import/util/ObjectStreamTransform'
import { transaction } from 'objection'
import { WorkGroup, Company, Employee, Geography } from 'server/api/models'
import sanitizeName from 'server/util/sanitizeName'
import moment from 'moment-timezone'

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
  const models = [WorkGroup, Company, Employee, Geography]
  await transaction(...models, async (WorkGroup, Company, Employee, Geography) => {
    let srData = null

    const getDtvWorkGroups = async w2Company => {
      const ensureDtvWorkGroups = async type => {
        const workGroups = await WorkGroup.query().where({ companyId: w2Company.id, type })
        if (workGroups.length !== 0) return workGroups
        return await createAllWorkGroupsOfType(type)
      }
      const createAllWorkGroupsOfType = async type => {
        const knex = WorkGroup.knex()
        const namesForType = _.map(
          await knex
          .distinct(type)
          .from('directv_sr_data')
          .where({ HSP: w2Company.name }),
          type
        )
        const order = workGroupOrders[type]
        return await Promise.mapSeries(namesForType, async name => {
          return await WorkGroup.query().insert({
            companyId: w2Company.id,
            externalId: name,
            order,
            name,
            type,
          })
        })
      }
      return await Promise.props({
        'Service Region': ensureDtvWorkGroups('Service Region'),
        Office: ensureDtvWorkGroups('Office'),
        DMA: ensureDtvWorkGroups('DMA'),
        Division: ensureDtvWorkGroups('Division'),
      })
    }

    const streamToArray = async (stream, transformCallback) =>
      new Promise(async (resolve, reject) => {
        const objArray = []
        stream
        .pipe(new ObjectStreamTransform(transformCallback))
        .on('data', obj => objArray.push(obj))
        .on('end', () => {
          resolve(objArray)
        })
        .on('error', error => {
          reject(error)
        })
      })

    let workGroups = null

    const workGroupOrders = {
      Company: 0,
      Division: 1,
      DMA: 2,
      Office: 3,
      'Service Region': 4,
      Team: 5,
      Tech: 6,
    }

    const ensureWorkGroup = async ({ type, companyId, externalId, name }) => {
      workGroups[type] = workGroups[type] || {}
      if (workGroups[type][externalId]) return workGroups[type][externalId]
      const queryProps = { type, companyId, externalId }
      const order = workGroupOrders[type]
      workGroups[type][externalId] =
        (await WorkGroup.query()
        .where(queryProps)
        .first()) ||
        (await WorkGroup.query()
        .insert({ ...queryProps, order, name })
        .returning('*'))
      return workGroups[type][externalId]
    }

    const upsertTech = async ({ companyId, techData, dataSource }) => {
      const query = { companyId, externalId: techData['Tech User ID'] }
      const latitude = techData['Start Latitude'] / 1000000 || null
      const longitude = techData['Start Longitude'] / 1000000 || null
      const update = {
        dataSourceId: dataSource.id,
        terminatedAt: null,
        name: sanitizeName(techData['Tech Full Name']),
        phoneNumber: techData['Tech Mobile Phone #'],
        skills: techData['Skill Package'],
        schedule: techData['Tech Schedule'],
      }
      const startLatLong = latitude && longitude && { latitude, longitude }
      const employee = await upsertEmployee({ query, update, startLatLong })
      return employee
    }
    const upsertSupervisor = async ({ companyId, techData, dataSource }) => {
      const query = { companyId, externalId: techData['Tech Team Supervisor Login'] }
      const update = {
        role: 'Manager',
        name: sanitizeName(techData['Team Name']),
        phoneNumber: techData['Tech Team Supervisor Mobile #'],
        dataSourceId: dataSource.id,
        terminatedAt: null,
      }
      return await upsertEmployee({ query, update })
    }
    const allEmployeeExternalIds = []

    const upsertEmployee = async ({ query, update, startLatLong }) => {
      allEmployeeExternalIds.push(query.externalId)

      // find employee (eager startLocation for the upsert)
      let employee = await Employee.query()
      .eager('startLocation')
      .where(query)
      .first()

      // upsert start location
      const startLocation =
        startLatLong &&
        (await Geography.query().upsertGraph({
          type: 'Start Location',
          ...(employee && employee.startLocation),
          ...startLatLong,
        }))
      // find timezone based on start location
      const timezone = startLocation && (await startLocation.getTimezone())

      // upsert
      if (!employee) {
        employee = await Employee.query()
        .insertGraph({
          ...query,
          ...update,
          timezone,
          startLocationId: startLocation && startLocation.id,
        })
        .returning('*')
      } else {
        employee = await Employee.query()
        .where(query)
        .update({
          ...update,
          timezone,
          startLocationId: startLocation && startLocation.id,
        })
        .returning('*')
        .first()
      }

      return employee
    }

    const companies = {}
    const ensureCompany = async name => {
      if (companies[name]) return companies[name]
      companies[name] = await Company.query()
      .where({ name })
      .first()
      if (companies[name]) return companies[name]
      companies[name] = await Company.query()
      .insert({ name })
      .returning('*')
      return companies[name]
    }

    const w2CompanyName = serviceW2Company[dataSource.service]
    srData = _.keyBy(
      await WorkGroup.knex()
      .select('Service Region', 'Office', 'DMA', 'Division')
      .from('directv_sr_data')
      .where({ HSP: w2CompanyName }),
      'Service Region'
    )

    const w2Company = await ensureCompany(w2CompanyName)

    workGroups = await getDtvWorkGroups(w2Company)

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
      const company = await ensureCompany(companyName)

      const companyId = company.id

      const companyTechDatas = techDatasByCompany[companyName]
      await Promise.map(
        companyTechDatas,
        async techData => {
          const employee = await upsertTech({ companyId, techData, dataSource })

          await employee.$loadRelated('workGroups')

          const techSR = techData['Service Region']

          const relatedWorkGroupsById = _.keyBy(employee.workGroups, 'id')
          const ensureRelated = async workGroup => {
            if (workGroup && !relatedWorkGroupsById[workGroup.id]) {
              await employee.$relatedQuery('workGroups').relate(workGroup)
              relatedWorkGroupsById[workGroup.id] = workGroup
            }
          }

          const techWorkGroup = await ensureWorkGroup({
            type: 'Tech',
            companyId: w2Company.id,
            externalId: employee.externalId,
            name: employee.name,
          })
          await employee.$query().patch({ workGroupId: techWorkGroup.id })
          await ensureRelated(techWorkGroup)

          const teamWorkGroup = await ensureWorkGroup({
            type: 'Team',
            companyId: w2Company.id,
            externalId: techData['Team ID'],
            name: techData['Team ID'],
          })
          const supervisor = await upsertSupervisor({ companyId, techData, dataSource })
          await supervisor.$loadRelated('managedWorkGroups')
          if (!_.find(supervisor.managedWorkGroups, { id: teamWorkGroup.id })) {
            await supervisor.$relatedQuery('managedWorkGroups').relate(teamWorkGroup)
          }
          await ensureRelated(teamWorkGroup)

          await ensureRelated(
            await ensureWorkGroup({
              type: 'Company',
              companyId: w2Company.id,
              externalId: w2Company.name,
              name: w2Company.name,
            })
          )
          await ensureRelated(
            await ensureWorkGroup({
              type: 'Company',
              companyId,
              externalId: company.name,
              name: company.name,
            })
          )
          const techSrData = srData[techSR]
          await ensureRelated(
            await ensureWorkGroup({
              type: 'Service Region',
              companyId: w2Company.id,
              externalId: techSR,
              name: techSR,
            })
          )
          if (techSrData) {
            await ensureRelated(
              await ensureWorkGroup({
                type: 'Office',
                companyId: w2Company.id,
                externalId: techSrData['Office'],
                name: techSrData['Office'],
              })
            )
            await ensureRelated(
              await ensureWorkGroup({
                type: 'DMA',
                companyId: w2Company.id,
                externalId: techSrData['DMA'],
                name: techSrData['DMA'],
              })
            )
            await ensureRelated(
              await ensureWorkGroup({
                type: 'Division',
                companyId: w2Company.id,
                externalId: techSrData['Division'],
                name: techSrData['Division'],
              })
            )
          }
        },
        { concurrency: 1 }
      )
      await Employee.query()
      .where({ dataSourceId: dataSource.id })
      .whereNotIn('externalId', allEmployeeExternalIds)
      .patch({ terminatedAt: moment.utc().format() })
    })
  })
}
