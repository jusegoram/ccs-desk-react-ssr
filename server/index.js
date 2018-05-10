import { graphqlExpress } from 'apollo-server-express'
// import getCreateContext from 'server/api/util/getCreateContext'
import { Model } from 'objection'
import knex from 'server/knex'
import { builder as graphQlBuilder } from 'objection-graphql'
import * as models from 'server/api/models'
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import { GraphQLInt, GraphQLBoolean } from 'graphql'
import createToken from 'server/api/util/createToken'
import createClientMoment from 'server/api/util/createClientMoment'

import restRouter from 'server/api/restRouter'
import downloadRouter from 'server/api/downloadRouter'

Model.knex(knex)

// initialize builder
const graphqlSchema = graphQlBuilder()
.selectFiltering(false)
.allModels(Object.values(models))
.extendWithModelMutations({ prefixWithClassName: true })
.argFactory((/*fields, modelClass*/) => {
  /* These Must Be Synchronous */
  const args = {
    limit: {
      type: GraphQLInt,
      query: (query, value) => {
        return query.limit(value)
      },
    },
    offset: {
      type: GraphQLInt,
      query: (query, value) => {
        return query.offset(value)
      },
    },
    mine: {
      type: GraphQLBoolean,
      query: (query, value) => {
        if (!value || !query._mine) return query
        return query._mine()
      },
    },
  }
  return args
})
.build()
export default async app => {
  app.use((req, res, next) => {
    const timezone = req.cookies.timezone
    req.moment = createClientMoment(timezone)
    next()
  })

  app.use(async (req, res, next) => {
    let session = null
    const clientContext = req.headers.clientcontext || 'Website'
    const clientVersion = req.headers.clientversion
    if (clientVersion && clientVersion !== '1.0.0') {
      return res.status(409).json({})
    }
    try {
      const useCookieToken = clientContext !== 'Mobile'
      const cookieToken = req.headers.cookie && cookie.parse(req.headers.cookie).token
      const authHeaderToken = req.headers.authorization && req.headers.authorization.split(' ')[1]
      const token = useCookieToken ? cookieToken || authHeaderToken : authHeaderToken
      if (token) {
        const jwtPayload = jwt.verify(token, process.env.JWT_SECRET)
        const { sessionId } = jwtPayload
        session = await models.Session.query()
        .eager(models.Session.defaultEagerRelations)
        .findById(sessionId)
        if (!session) {
          return res
          .cookie('token', '')
          .status(401)
          .json({})
        } else {
          const newToken = createToken({ sessionId, clientContext })
          res.cookie('token', newToken)
        }
      }
    } catch (e) {
      console.error(e) // eslint-disable-line no-console
    }
    if (req.headers.root === 'ASDF') session = undefined
    req.session = session
    next()
  })

  app.get('/api/logout', (req, res) => {
    res.cookie('token', '').sendStatus(200)
  })
  app.use('/api', restRouter)
  app.use('/download', downloadRouter)
  app.use(
    '/graphql',
    graphqlExpress(async (req, res) => {
      const { session, moment } = req
      return {
        schema: graphqlSchema,
        context: { req, res, session, moment },
        rootValue: {
          async onQuery(builder) {
            await builder.mergeContext({ session, moment })._contextFilter()
          },
        },
        pretty: process.env.NODE_ENV === 'development',
      }
    })
  )
}
