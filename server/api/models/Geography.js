import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { raw } from 'objection'
import { GraphQLString } from 'graphql'
import axios from 'axios'
import ExpectedError from 'server/errors/ExpectedError'

export default class Geography extends APIModel {
  static knexCreateTable = `
    table.uuid('id').primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string('streetAddress')
    table.string('zipcode')
    table.string('city')
    table.string('state')
    table.string('country')
    table.text('polygonKml')
    table.float('radius')
    table.decimal('latitude', 10, 7)
    table.decimal('longitude', 10, 7)
    table.specificType('polygon', 'geography(MULTIPOLYGON, 4326)').index()
    table.specificType('point', 'geography(POINT, 4326)').index()
    table.index(['latitude', 'longitude'])
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  `

  static jsonSchema = {
    title: 'Region',
    description: 'A region of the world',
    type: 'object',

    properties: {
      id: { type: 'string' },
      streetAddress: { type: ['string', 'null'] },
      zipcode: { type: ['string', 'null'] },
      city: { type: ['string', 'null'] },
      state: { type: ['string', 'null'] },
      country: { type: ['string', 'null'] },
      radius: { type: ['number', 'null'] },
      latitude: { type: ['number', 'null'] },
      longitude: { type: ['number', 'null'] },
      polygonKml: { type: ['string', 'null'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  }

  static visible = [
    'id',
    'polygonKml',
    'radius',
    'streetAddress',
    'zipcode',
    'city',
    'state',
    'country',
    'latitude',
    'longitude',
  ]

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        this.whereRaw('FALSE')
      }
    }
  }

  $afterUpdate(queryContext) {
    return Promise.resolve(super.$afterUpdate(queryContext)).then(async () => this.ensurePoint())
  }
  $afterInsert(queryContext) {
    return Promise.resolve(super.$afterInsert(queryContext)).then(async () => this.ensurePoint())
  }
  async ensurePoint() {
    if (this.latitude && this.longitude && !this.point) {
      await this.$query().patch({ point: raw('ST_SetSRID(ST_Point(?, ?),4326)', this.longitude, this.latitude) })
    }
  }

  getTimezone() {
    return this.$knex()
    .from('timezones')
    .select('name')
    .whereRaw('ST_Contains(timezones.polygon::geometry, ST_SetSRID(ST_Point(?, ?),4326))', [
      this.longitude,
      this.latitude,
    ])
    .first()
    .get('name')
  }

  static get mutations() {
    return {
      geocode: {
        description: 'turn an address into a lat/long',
        type: this.GraphqlTypes.Geography,
        args: {
          address: { type: GraphQLString },
        },
        resolve: async (root, { address }) => {
          const encodedAddress = encodeURIComponent(address)
          const result = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`
          )
          if (result.status !== 200) {
            throw new ExpectedError('We were unable to convert that address into a latitude/longitude pair.')
          }
          const { lat, lng } = result.data.results[0].geometry.location
          return {
            id: '00000000-0000-0000-0000-000000000000',
            latitude: lat,
            longitude: lng,
          }
        },
      },
    }
  }
}
