import { toPairs, snakeCase, sortBy } from 'lodash'

const indent = line => `  ${line}`

const typeDefaults = {
  integer: 'integer',
  number: 'float',
  boolean: 'boolean',
  object: 'jsonb',
  array: 'jsonb',
  string: 'string',
}

const generateMigration = models => {
  const allTableCreationLines = Object.values(models).map(model => {
    return getTableCreationLines(model)
    .map(indent)
    .join('\n')
  })
  const allTableAlterLines = Object.values(models).map(model => {
    return getTableAlterLines(model)
    .map(indent)
    .join('\n')
  })
  const allJoinTableCreationLines = Object.values(models).map(model => {
    return getJoinTableCreations(model)
    .map(indent)
    .join('\n')
  })
  const content = [
    'export function up(knex) {',
    '  return knex.schema',
    ...allTableCreationLines,
    ...allTableAlterLines,
    ...allJoinTableCreationLines,
    '}',
  ].join('\n')
  return removeEmptyLines(content)
}
const removeEmptyLines = text => {
  return text
  .split('\n')
  .filter(line => !line.match(/^\s*$/))
  .join('\n')
}
const getTableCreationLines = model => {
  if (!model.knexCreateTable) return []
  return [`.createTable('${model.tableName}', table => {`, model.knexCreateTable, '})']
}

const getTableAlterLines = model => {
  if (!model.knexAlterTable) return []
  return [`.alterTable('${model.tableName}', table => {`, model.knexAlterTable, '})']
}

const getJoinTableCreations = model => {
  if (!model.knexCreateJoinTables) return []
  const output = []
  for (const joinTableName in model.knexCreateJoinTables) {
    const tableBody = model.knexCreateJoinTables[joinTableName]
    output.push(`.createTable('${joinTableName}', table => { ${tableBody} \n  })`)
  }
  return output
}

export default generateMigration
