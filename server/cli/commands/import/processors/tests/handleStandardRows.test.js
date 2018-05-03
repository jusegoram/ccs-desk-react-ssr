import * as models from 'server/api/models'
import knex from 'server/knex'
import _ from 'lodash'
import { Model } from 'objection'
import handleStandardRows from '../routelog/handleStandardRows'
import processTechProfile from '../techProfile/processTechProfile'
import DataSource from 'server/api/models/DataSource'

const techProfileInput = require('./techProfile.input.json')
const routelogInput = require('./routelog.input.json')

Model.knex(knex)

const { Company } = models

describe('handleStandardRows', () => {
  afterAll(async () => {
    await knex.destroy()
  })
  beforeAll(async () => {
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
