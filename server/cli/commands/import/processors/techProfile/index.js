import _ from 'lodash'
import Promise from 'bluebird'

import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import moment from 'moment-timezone'
import { streamToArray, sanitizeName, Timer } from 'server/util'

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
  const timer = new Timer()
  timer.start('Total')
  timer.start('Initialization')
  await transaction(..._.values(rawModels), async (...modelsArray) => {
    const models = _.keyBy(modelsArray, 'name')
    const { WorkGroup, Company, Employee, Geography } = models
    const knex = Employee.knex()
    const dataSourceId = dataSource.id
    const workGroupCache = {}

    let srData = null

    const allEmployeeExternalIds = []

    const w2CompanyName = serviceW2Company[dataSource.service]
    srData = _.keyBy(
      await knex
      .select('Service Region', 'Office', 'DMA', 'Division')
      .from('directv_sr_data')
      .where({ HSP: w2CompanyName }),
      'Service Region'
    )

    const w2Company = await Company.query().ensure(w2CompanyName)

    const datas = await streamToArray(csvObjStream, data => {
      if (data['Tech Type'] === 'W2' || !data['Tech Type']) data['Tech Type'] = w2CompanyName
      data.Company = data['Tech Type']
      if (data.Company !== w2CompanyName || !data['Team ID'] || data['Team ID'] === 'UNKNOWN') delete data['Team ID']
      data.Team = data['Team ID']
      data.Tech = data['Tech User ID']
      return data
    })

    timer.split('Load Existing')
    const dbEmployees = _.keyBy(
      await Employee.query()
      .eager('[workGroups, startLocation]')
      .where({ dataSourceId }),
      'externalId'
    )

    await Promise.mapSeries(datas, async data => {
      timer.split('Ensure Company')
      const company = await Company.query().ensure(data['Tech Type'])
      const companyId = company.id

      timer.start('Employee Upsert')
      const dbEmployee = dbEmployees[data['Tech User ID']]
      let employee = dbEmployee
      if (!employee || !_.isEqual(employee.data, data)) {
        timer.start('Create Start Location')
        const latitude = data['Start Latitude'] / 1000000 || null
        const longitude = data['Start Longitude'] / 1000000 || null
        const startLocation = latitude && longitude && (await Geography.query().ensure({ latitude, longitude }))
        const timezone = startLocation && startLocation.timezone
        timer.stop('Create Start Location')

        employee = await Employee.query()
        .eager('[workGroups, startLocation]')
        .upsert({
          query: { dataSourceId, externalId: data['Tech User ID'] },
          update: {
            companyId,
            alternateExternalId: data['Tech ATT UID'],
            terminatedAt: null,
            name: sanitizeName(data['Tech Full Name']),
            phoneNumber: data['Tech Mobile Phone #'],
            skills: data['Skill Package'],
            schedule: data['Tech Schedule'],
            timezone,
            startLocationId: startLocation && startLocation.id,
          },
        })
      }
      allEmployeeExternalIds.push(employee.externalId)
      timer.stop('Employee Upsert')

      timer.split('Upsert Supervisor')
      const supervisor = await Employee.query().upsert({
        query: { companyId, externalId: data['Tech Team Supervisor Login'] },
        update: {
          role: 'Manager',
          name: sanitizeName(data['Team Name']),
          phoneNumber: data['Tech Team Supervisor Mobile #'],
          dataSourceId: dataSource.id,
          terminatedAt: null,
          timezone: employee.timezone,
        },
      })

      timer.split('Ensure Work Groups')
      const techSR = data['Service Region']
      const techSrData = srData[techSR]
      const workGroupDatas = [
        {
          type: 'Tech',
          companyId: w2Company.id,
          externalId: employee.externalId,
          name: employee.name,
        },
        {
          type: 'Team',
          companyId: w2Company.id,
          externalId: data['Team ID'],
          name: sanitizeName(data['Team Name']),
        },
        {
          type: 'Company',
          companyId: w2Company.id,
          externalId: w2Company.name,
          name: w2Company.name,
        },
        {
          type: 'Company',
          companyId,
          externalId: company.name,
          name: company.name,
        },
        ...(!!techSrData && [
          {
            type: 'Service Region',
            companyId: w2Company.id,
            externalId: techSR,
            name: techSR,
          },
          {
            type: 'Office',
            companyId: w2Company.id,
            externalId: techSrData['Office'],
            name: techSrData['Office'],
          },
          {
            type: 'DMA',
            companyId: w2Company.id,
            externalId: techSrData['DMA'],
            name: techSrData['DMA'],
          },
          {
            type: 'Division',
            companyId: w2Company.id,
            externalId: techSrData['Division'],
            name: techSrData['Division'],
          },
        ]),
      ]

      timer.split('Work Groups _.differenceWith')
      const workGroupPrimaryKey = ['companyId', 'type', 'externalId']
      const hasSamePrimaryKey = (a, b) => _.isEqual(_.pick(a, workGroupPrimaryKey), _.pick(b, workGroupPrimaryKey))
      const newWorkGroupDatas = _.differenceWith(workGroupDatas, employee.workGroups, hasSamePrimaryKey)
      const obsoleteWorkGroups = _.differenceWith(employee.workGroups, workGroupDatas, hasSamePrimaryKey)

      timer.split('Ensure New Work Groups')
      const newWorkGroups = await Promise.map(newWorkGroupDatas, workGroupData =>
        WorkGroup.query().ensure(workGroupData, workGroupCache)
      )

      timer.split('Insert New Work Group Relations')
      await Promise.mapSeries(_.uniqBy(newWorkGroups, 'id'), workGroup =>
        knex('workGroupEmployees').insert({
          employeeId: employee.id,
          workGroupId: workGroup.id,
          role: 'Tech',
        })
      )

      timer.split('Delete Old Work Group Relations')
      if (obsoleteWorkGroups.length) {
        await knex('workGroupEmployees')
        .where({ employeeId: employee.id, role: 'Tech' })
        .whereIn('workGroupId', _.map(obsoleteWorkGroups, 'id'))
        .delete()
      }

      timer.split('Refresh Employee Work Groups')
      await employee.$loadRelated('workGroups')

      timer.split('Set Tech Work Group')
      const techWorkGroup = _.find(employee.workGroups, { type: 'Tech' })
      await employee.$query().patch({ workGroupId: techWorkGroup.id })

      timer.split('Set Team Manager')
      const teamWorkGroup = _.find(employee.workGroups, { type: 'Team' })
      await teamWorkGroup.addManager(supervisor)
    })

    timer.split('Mark Terminated')
    await Employee.query()
    .where({ dataSourceId: dataSource.id, role: 'Tech' })
    .whereNotIn('externalId', allEmployeeExternalIds)
    .patch({ terminatedAt: moment.utc().format() })
  })
  timer.stop('Total')
  console.log(timer.toString()) // eslint-disable-line no-console
}
