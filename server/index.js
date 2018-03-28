import { graphqlExpress } from 'apollo-server-express'
// import getCreateContext from 'server/api/util/getCreateContext'
import { Model } from 'objection'
import knex from 'server/knex'
import { builder as graphQlBuilder } from 'objection-graphql'
import * as models from 'server/api/models'
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import { GraphQLInt, GraphQLList, GraphQLFloat } from 'graphql'
import axios from 'axios'
import ExpectedError from 'server/errors/ExpectedError'
import restRouter from 'server/api/restRouter'

Model.knex(knex)

// initialize builder
const graphqlSchema = graphQlBuilder()
.selectFiltering(false)
.allModels(Object.values(models))
.extendWithModelMutations({ prefixWithClassName: true })
.argFactory((fields, modelClass) => {
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
  }
  return args
})
.build()

export default async app => {
  app.use('/api', restRouter)
  app.use(
    '/graphql',
    graphqlExpress(async (req, res) => {
      let session = null
      try {
        const cookieToken = req.headers.cookie && cookie.parse(req.headers.cookie).token
        const authHeaderToken = req.headers.authentication && req.headers.authentication.split(' ')[1]
        const token = cookieToken || authHeaderToken
        if (token) {
          console.log(token)
          console.log(process.env.JWT_SECRET)
          const jwtPayload = jwt.verify(token, process.env.JWT_SECRET)
          session = await models.Session.query()
          .eager('account')
          .findById(jwtPayload.sessionId)
        }
      } catch (e) {
        session = null
        // res.cookie('token', '')
        console.error(e) // eslint-disable-line no-console
      }
      if (req.headers.root === 'ASDF') session = undefined
      return {
        schema: graphqlSchema,
        context: { session, req, res },
        rootValue: {
          async onQuery(builder) {
            await builder.mergeContext({ session })._contextFilter()
          },
        },
        pretty: process.env.NODE_ENV === 'development',
      }
    })
  )
}
