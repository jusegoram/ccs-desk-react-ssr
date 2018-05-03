import * as models from 'server/api/models'
import knex from 'server/knex'
import _ from 'lodash'
import { Model } from 'objection'
import handleStandardRows from '../cli/commands/import/processors/routelog/handleStandardRows'
import processTechProfile from '../cli/commands/import/processors/techProfile/processTechProfile'

const techProfileInput = require('./techProfile.input.json')
const routelogInput = require('./routelog.input.json')

Model.knex(knex)

const { Company } = models

describe('Server', () => {
  beforeAll(() => {
    if ((process.env.KNEX_ENV || process.env.NODE_ENV) === 'production') {
      throw new Error('You were about to delete the production database. Do not run tests against production.')
    }
  })
  afterAll(async () => {
    await knex.destroy()
  })
  describe('CLI importer', () => {
    beforeEach(async () => {
      await knex.seed.run()
    })
    it('should create a work group for each work group in the data', async () => {
      const w2Company = await Company.query().findOne({ name: 'Goodman' })
      const dataSource = await w2Company.$relatedQuery('dataSources').findOne({ name: 'Siebel Routelog' })
      expect(dataSource).toBeDefined()
      await handleStandardRows({ rows: routelogInput, models, w2Company, dataSource })
    })
    it('should handle tech data', async () => {
      const w2Company = await Company.query().findOne({ name: 'Goodman' })
      const dataSource = await w2Company.$relatedQuery('dataSources').findOne({ name: 'Tech Profile' })
      await processTechProfile({ datas: techProfileInput, dataSource, w2Company })
    })
  })
  describe('API', () => {
    beforeEach(async () => {
      await knex.seed.run()
      const w2Company = await Company.query().findOne({ name: 'Goodman' })
      const rlDataSource = await w2Company.$relatedQuery('dataSources').findOne({ name: 'Siebel Routelog' })
      expect(rlDataSource).toBeDefined()
      await handleStandardRows({ rows: routelogInput, models, w2Company, dataSource: rlDataSource })
    })
    describe('models', () => {
      describe('Company', () => {
        it('should be able to get its primary work group', async () => {
          const company = await Company.query().findOne({ name: 'Next Solutions LLC' })
          expect(company).toBeDefined()
          await company.$loadRelated('workGroup')
          expect(company.workGroup).toBeDefined()
        })
        it('should be able to get work orders from its primary work group', async () => {
          const company = await Company.query().findOne({ name: 'Next Solutions LLC' })
          expect(company).toBeDefined()
          await company.$loadRelated('workGroup')
          expect(company.workGroup).toBeDefined()
          const workOrders = await company.workGroup.$relatedQuery('workOrders')
          expect(workOrders.length).toBe(1)
        })
      })
    })
  })
})
