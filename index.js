import express from 'express'
import next from 'next'
import cors from 'cors'
import morgan from 'morgan'
import url from 'url'
import compression from 'compression'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import setupServer from 'server'
import { express as voyager } from 'graphql-voyager/middleware'
import jwt from 'jsonwebtoken'
import notifier from 'node-notifier'

const dev = process.env.NODE_ENV !== 'production'
const port = 3000
const nextApp = next({ dev, quiet: true })
const nextRequestHandler = nextApp.getRequestHandler()

nextApp
.prepare()
.then(async () => {
  const server = express()

  if (!dev) {
    server.use(compression())
  }

  server.use(cookieParser())
  server.use(morgan('dev'))
  server.use(cors({ credentials: true, origin: true }))
  server.use(bodyParser.json())
  server.use(
    bodyParser.urlencoded({
      extended: false,
    })
  )

  if (process.env.NODE_ENV === 'development') {
    server.use('/voyager', voyager({ endpointUrl: '/graphql' }))
  }

  await setupServer(server)

  server.get('*', (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const { pathname, query } = parsedUrl

      const passwordResetTokenMatch = pathname.match(/^\/reset-password\/(.+)$/)
      const inviteTokenMatch = pathname.match(/^\/invites\/accept\/(.+)$/)
      const employeeMatch = pathname.match(/^\/organization\/tech\/(.+)$/)
      const workGroupMatch = pathname.match(/^\/organization\/team\/(.+)$/)

      if (passwordResetTokenMatch) {
        try {
          const passwordResetToken = passwordResetTokenMatch[1]
          jwt.verify(passwordResetToken, process.env.JWT_SECRET)
          req.passwordResetToken = passwordResetToken
        } catch (e) {} // eslint-disable-line no-empty

        nextApp.render(req, res, '/reset-password', query)
      } else if (inviteTokenMatch) {
        req.inviteToken = inviteTokenMatch[1]
        nextApp.render(req, res, '/invites/accept', query)
      } else if (employeeMatch) {
        query.employeeId = employeeMatch[1]
        nextApp.render(req, res, '/organization/tech', query)
      } else if (workGroupMatch) {
        query.workGroupId = workGroupMatch[1]
        nextApp.render(req, res, '/organization/team', query)
      } else {
        nextRequestHandler(req, res, parsedUrl)
      }
    } catch (e) {
      console.error(e) // eslint-disable-line no-console
    }
  })

  server.listen(port, err => {
    if (err) {
      throw err
    }
    if (process.env.NODE_ENV === 'development') {
      notifier.notify({
        title: 'CCS Desk Server',
        message: `Running on http://localhost:${port}`,
      })
    }
  })
})
.catch(e => {
  console.error('Server Error:') // eslint-disable-line no-console
  console.error(e) // eslint-disable-line no-console
  process.exit(1)
})
