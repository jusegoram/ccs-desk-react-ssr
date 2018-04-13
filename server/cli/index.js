import Knex from 'knex'
import knexfile from 'server/../knexfile'
import { Model } from 'objection'
import Promise from 'bluebird'

if (process.env.NODE_ENV === 'development') Promise.longStackTraces()

const knex = Knex({
  debug: process.env.DEBUG,
  ...knexfile[process.env.NODE_ENV],
})

Model.knex(knex)

const prog = require('caporal')
const importFromSiebel = require('./commands/import')
const resaturateReport = require('./commands/import/resaturate')
const crontab = require('./commands/crontab')

const runFunction = fn => async (args = {}, options = {}) => {
  try {
    await fn({ knex, ...args, ...options })
  } catch (e) {
    console.error(e)
  } finally {
    knex.destroy()
  }
}

prog
.version('1.0.0')
.command('import', 'download report from analytics and insert into database')
.argument(
  '<service>'
  // 'the source from which to import the report: ' + importFromSiebel.sources.join(', ')
  // new RegExp(`^${importFromSiebel.sources.join('|')}$`)
)
.argument(
  '<name>'
  // 'the name of the report to import: ' + importFromSiebel.reports.join(', ')
  // new RegExp(`^${importFromSiebel.reports.join('|')}$`)
)
.action(runFunction(importFromSiebel))
.command('resaturate', 'resaturate imported report')
.argument(
  '<source>'
  // 'the source from which to import the report: ' + importFromSiebel.sources.join(', '),
  // new RegExp(`^${importFromSiebel.sources.join('|')}$`)
)
.argument(
  '<reportName>'
  // 'the name of the report to import: ' + importFromSiebel.reports.join(', '),
  // new RegExp(`^${importFromSiebel.reports.join('|')}$`)
)
.argument('<cid>', 'the cid of the report to resaturate')
.action(runFunction(resaturateReport))
.command('crontab', 'synchronize crontab config with computer')
.argument('<action>', 'what you want to do: test, update', /^(test|update)$/)
.action(runFunction(crontab))

prog.parse(process.argv)
