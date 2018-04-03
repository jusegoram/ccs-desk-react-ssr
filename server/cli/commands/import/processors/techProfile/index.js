import _ from 'lodash'
import moment from 'moment'
import Promise from 'bluebird'
import ObjectStreamTransform from 'server/cli/commands/import/util/ObjectStreamTransform'
import { transaction } from 'objection'
import { WorkForce, Company, Employee } from 'server/api/models'
import sanitizeName from 'server/util/sanitizeName'

const models = [WorkForce, Company, Employee]

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
let srData = null

const getDtvWorkForces = async w2Company => {
  const ensureDtvWorkForces = async type => {
    const workForces = await WorkForce.query().where({ companyId: w2Company.id, type })
    if (workForces.length !== 0) return workForces
    return await createAllWorkForcesOfType(type)
  }
  const createAllWorkForcesOfType = async type => {
    const knex = WorkForce.knex()
    const namesForType = _.map(
      await knex
      .distinct(type)
      .from('directv_sr_data')
      .where({ HSP: w2Company.name }),
      type
    )
    return await Promise.mapSeries(namesForType, async name => {
      return await WorkForce.query().insert({
        companyId: w2Company.id,
        externalId: name,
        name,
        type,
      })
    })
  }
  return await Promise.props({
    'Service Region': ensureDtvWorkForces('Service Region'),
    Office: ensureDtvWorkForces('Office'),
    DMA: ensureDtvWorkForces('DMA'),
    Division: ensureDtvWorkForces('Division'),
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

let workForces = null

const ensureWorkForce = async ({ type, companyId, externalId, name }) => {
  workForces[type] = workForces[type] || {}
  if (workForces[type][externalId]) return workForces[type][externalId]
  const queryProps = { type, companyId, externalId }
  workForces[type][externalId] =
    (await WorkForce.query()
    .where(queryProps)
    .first()) ||
    (await WorkForce.query()
    .insert({ ...queryProps, name })
    .returning('*'))
  return workForces[type][externalId]
}

const upsertTech = async ({ companyId, techData, dataSource }) => {
  const query = { companyId, externalId: techData['Tech User ID'] }
  const update = {
    name: sanitizeName(techData['Tech Full Name']),
    phoneNumber: techData['Tech Mobile Phone #'],
    dataSourceId: dataSource.id,
    terminatedAt: null,
  }
  return await upsertEmployee({ query, update })
}
const upsertSupervisor = async ({ companyId, techData, dataSource }) => {
  const query = { companyId, externalId: techData['Tech Team Supervisor Login'] }
  const update = {
    name: sanitizeName(techData['Team Name']),
    phoneNumber: techData['Tech Team Supervisor Mobile #'],
    dataSourceId: dataSource.id,
    terminatedAt: null,
  }
  return await upsertEmployee({ query, update })
}
const allEmployeeExternalIds = []

const upsertEmployee = async ({ query, update }) => {
  allEmployeeExternalIds.push(query.externalId)
  let employee = await Employee.query()
  .where(query)
  .first()
  if (!employee) {
    employee = await Employee.query()
    .insert({
      ...query,
      ...update,
    })
    .returning('*')
  } else {
    employee = await Employee.query()
    .where(query)
    .update(update)
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

export default async ({ csvObjStream, dataSource }) => {
  await transaction(...models, async (WorkForce, Company, Employee) => {
    const w2CompanyName = serviceW2Company[dataSource.service]
    srData = _.keyBy(
      await WorkForce.knex()
      .select('Service Region', 'Office', 'DMA', 'Division')
      .from('directv_sr_data')
      .where({ HSP: w2CompanyName }),
      'Service Region'
    )

    const w2Company = await ensureCompany(w2CompanyName)

    workForces = await getDtvWorkForces(w2Company)

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

          await employee.$loadRelated('workForces')

          const techSR = techData['Service Region']

          const relatedWorkForcesById = _.keyBy(employee.workForces, 'id')
          const ensureRelated = async workForce => {
            if (workForce && !relatedWorkForcesById[workForce.id]) {
              await employee.$relatedQuery('workForces').relate(workForce)
              relatedWorkForcesById[workForce.id] = workForce
            }
          }

          const teamWorkForce = await ensureWorkForce({
            type: 'Team',
            companyId: w2Company.id,
            externalId: techData['Team ID'],
            name: techData['Team ID'],
          })
          const supervisor = await upsertSupervisor({ companyId, techData, dataSource })
          await supervisor.$loadRelated('managedWorkForces')
          if (!_.find(supervisor.managedWorkForces, { id: teamWorkForce.id })) {
            await supervisor.$relatedQuery('managedWorkForces').relate(teamWorkForce)
          }

          await ensureRelated(teamWorkForce)
          await ensureRelated(
            await ensureWorkForce({
              type: 'Company',
              companyId: w2Company.id,
              externalId: w2Company.name,
              name: w2Company.name,
            })
          )
          await ensureRelated(
            await ensureWorkForce({
              type: 'Company',
              companyId,
              externalId: company.name,
              name: company.name,
            })
          )
          const techSrData = srData[techSR]
          await ensureRelated(
            await ensureWorkForce({
              type: 'Service Region',
              companyId: w2Company.id,
              externalId: techSR,
              name: techSR,
            })
          )
          if (techSrData) {
            await ensureRelated(
              await ensureWorkForce({
                type: 'Office',
                companyId: w2Company.id,
                externalId: techSrData['Office'],
                name: techSrData['Office'],
              })
            )
            await ensureRelated(
              await ensureWorkForce({
                type: 'DMA',
                companyId: w2Company.id,
                externalId: techSrData['DMA'],
                name: techSrData['DMA'],
              })
            )
            await ensureRelated(
              await ensureWorkForce({
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
