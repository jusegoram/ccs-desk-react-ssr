import * as models from 'server/api/models'
import knex from 'server/knex'
import { Model } from 'objection'
import handleStandardRows from '../handleStandardRows'

const input = require('./input.json')
const _ = require('lodash')

Model.knex(knex)

const { Company } = models

describe('handleStandardRows', () => {
  afterAll(async () => {
    await knex.destroy()
  })
  beforeEach(async () => {
    await knex.seed.run()
  })
  it('should create a work group for each work group in the data', async () => {
    const w2Company = await Company.query().findOne({ name: 'Goodman' })
    await handleStandardRows({ rows: input, models, w2Company })
  })
})
