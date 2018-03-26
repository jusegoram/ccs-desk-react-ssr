import { Model, snakeCaseMappers } from 'objection'
import compose from 'server/api/util/compose'
import { DbErrors as withDbErrors } from 'objection-db-errors'
import path from 'path'
import projectRootPath from 'server/util/projectRootPath'

const applyPlugins = compose(withDbErrors)

export default applyPlugins(
  class BaseModel extends Model {
    static get modelPaths() {
      return [path.resolve(projectRootPath, 'server/api/models')]
    }
    // static get columnNameMappers() {
    //   return snakeCaseMappers()
    // }
    static get tableName() {
      return this.name
    }
    // static defaultEagerAlgorithm = Model.JoinEagerAlgorithm
    static queryForUser(user) {
      const query = this.query().mergeContext({ user })
      if (query._contextFilter) query._contextFilter()
      return query
    }

    $parseDatabaseJson(json) {
      json = super.$parseDatabaseJson(json)
      if (this.constructor.jsonSchema) {
        for (const key in json) {
          const config = this.constructor.jsonSchema.properties[key]
          if (config && config.format === 'date-time') json[key] = json[key] && json[key].toISOString()
        }
      }
      return json
    }
  }
)
