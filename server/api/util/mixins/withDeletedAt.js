import Knex from 'knex'
import softDelete from 'objection-soft-delete'

const knex = Knex({ dialect: 'pg' })

const softDeleteOptions = { columnName: 'deletedAt', deletedValue: knex.fn.now(), notDeletedValue: null }

export default ModelClass => softDelete(softDeleteOptions)(ModelClass)
