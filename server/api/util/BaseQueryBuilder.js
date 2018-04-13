import { QueryBuilder, raw } from 'objection'

export default class extends QueryBuilder {
  _contextFilter() {
    const { session } = this.context()
    if (session === undefined) return this
    if (session === null) return this.whereRaw('FALSE')
  }
  near(field, { lat, lng, radius }) {
    this.whereRaw('ST_Distance(ST_Point(?, ?)::geography, ??::geography) < ?', [lng, lat, field, radius]).orderBy(
      raw('ST_Distance(ST_Point(?, ?)::geography, ??::geography)', [lng, lat, field])
    )
  }
  async ensure(query) {
    return await this.upsert({ query })
  }
  async upsert({ query, update }) {
    const instance = await this.clone()
    .where(query)
    .first()
    if (!instance) {
      return await this.clone()
      .insert({
        ...query,
        ...update,
      })
      .returning('*')
    } else {
      let qb = this.clone().where(query)
      if (update) qb = qb.patch(update)
      return await qb.returning('*').first()
    }
  }
}
