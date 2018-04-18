import Importer from 'server/data/Importer'
import { Model } from 'objection'
import knex from 'server/knex'

Model.knex(knex)

Importer.importAll()
