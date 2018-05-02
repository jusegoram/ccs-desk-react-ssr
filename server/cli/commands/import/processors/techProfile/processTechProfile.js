import { transaction } from 'objection'
import * as rawModels from 'server/api/models'
import _ from 'lodash'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import { sanitizeName, Timer } from 'server/util'

export default async ({ datas, dataSource, w2Company }) => {
  try {
    await transaction(..._.values(rawModels), async (...modelsArray) => {
      const timer = new Timer()
      timer.start('Total')
      timer.start('Initialization')

      const models = _.keyBy(modelsArray, 'name')
      const { WorkGroup, Company, Tech } = models
      const knex = Tech.knex()
      const dataSourceId = dataSource.id
      const workGroupCache = {}
      const w2CompanyName = w2Company.name
      const allEmployeeExternalIds = []

      const directv = await Company.query().findOne({ name: 'DirecTV' })

      const srData = _.keyBy(
        await WorkGroup.knex()()
        .select('Service Region', 'Office', 'DMA', 'Division')
        .from('directv_sr_data')
        .where({ HSP: w2CompanyName }),
        'Service Region'
      )

      timer.split('Load Existing')
      const dbEmployees = _.keyBy(await Tech.query(), 'externalId')

      const companyNames = _.without(_.map(_.uniqBy(datas, 'Tech Type'), 'Tech Type'), w2CompanyName)
      const subcontractors = _.keyBy(
        await Promise.map(companyNames, name => {
          return Company.query().ensure(name)
        }),
        'name'
      )

      await Promise.mapSeries(datas, async data => {
        try {
          timer.split('Ensure Company')
          const company = data['Tech Type'] === w2CompanyName ? w2Company : subcontractors[data['Tech Type']]

          timer.start('Employee Upsert')
          const dbEmployee = dbEmployees[data['Tech User ID']]
          if (dbEmployee && _.isEqual(data, dbEmployee.row)) return
          let employee = dbEmployee
          if (!employee || !_.isEqual(employee.data, data)) {
            timer.start('Create Start Location')
            // const latitude = data['Start Latitude'] / 1000000 || null
            // const longitude = data['Start Longitude'] / 1000000 || null
            timer.stop('Create Start Location')

            employee = !data['Tech User ID']
              ? null
              : await Tech.query().upsert({
                query: { companyId: directv.id, externalId: data['Tech User ID'] },
                update: {
                  dataSourceId,
                  alternateExternalId: data['Tech ATT UID'],
                  terminatedAt: null,
                  name: sanitizeName(data['Tech Full Name']),
                  phoneNumber: data['Tech Mobile Phone #'],
                  skills: data['Skill Package'],
                  schedule: data['Tech Schedule'],
                  row: data,
                },
              })
          }
          allEmployeeExternalIds.push(employee.externalId)
          timer.stop('Employee Upsert')

          timer.split('Ensure Work Groups')
          const techSR = data['Service Region']
          const techSrData = srData[techSR]
          const createWorkGroups = async scopeCompany =>
            _.filter(
              await Promise.all([
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'Tech',
                    externalId: employee.externalId,
                    name: employee.name,
                  },
                  workGroupCache
                ),
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'Team',
                    externalId: data['Team ID'],
                    name: sanitizeName(data['Team Name']),
                  },
                  workGroupCache
                ),
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'Company',
                    externalId: w2Company.name,
                    name: w2Company.name,
                  },
                  workGroupCache
                ),
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'Subcontractor',
                    externalId: company.name,
                    name: company.name,
                  },
                  workGroupCache
                ),
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'Service Region',
                    externalId: techSR,
                    name: techSR,
                  },
                  workGroupCache
                ),
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'Office',
                    externalId: techSrData && techSrData['Office'],
                    name: techSrData && techSrData['Office'],
                  },
                  workGroupCache
                ),
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'DMA',
                    externalId: techSrData && techSrData['DMA'],
                    name: techSrData && techSrData['DMA'],
                  },
                  workGroupCache
                ),
                WorkGroup.query().ensure(
                  {
                    companyId: scopeCompany.id,
                    type: 'Division',
                    externalId: techSrData && techSrData['Division'],
                    name: techSrData && techSrData['Division'],
                  },
                  workGroupCache
                ),
              ])
            )
          const w2WorkGroups = createWorkGroups(w2Company)
          const subWorkGroups = w2Company.id === company.id ? [] : createWorkGroups(company)

          await knex('workGroupTechs')
          .where({ techId: employee.id })
          .delete()
          await Promise.map(w2WorkGroups, workGroup =>
            knex('workGroupTechs').insert({
              workGroupId: workGroup.id,
              techId: employee.id,
            })
          )
          await Promise.map(subWorkGroups, workGroup =>
            knex('workGroupTechs').insert({
              workGroupId: workGroup.id,
              techId: employee.id,
            })
          )
        } catch (e) {
          console.error(data) // eslint-disable-line no-console
          throw e
        }
      })

      timer.split('Mark Terminated')
      await Tech.query()
      .where({ companyId: directv.id })
      .whereNotIn('externalId', allEmployeeExternalIds)
      .patch({ terminatedAt: moment.utc().format() })
      timer.stop('Total')
      console.log(timer.toString()) // eslint-disable-line no-console
    })
  } catch (e) {
    console.error(e)
    throw e
  }
}
