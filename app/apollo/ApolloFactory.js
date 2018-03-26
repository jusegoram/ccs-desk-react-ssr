import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { concat } from 'apollo-link'
import fetch from 'isomorphic-unfetch'
import { onError } from 'apollo-link-error'
import Promise from 'bluebird'
import alert from 'sweetalert'
import ExpectedError from 'server/errors/ExpectedError'
import { bindAll } from 'lodash'

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch
}

// helper for running middleware
const runReducer = (...staticArgs) => (current, reducer) => reducer(current, ...staticArgs)

let globalApollo = null
export default class ApolloFactory {
  static getInstance() {
    if (process.server) return new ApolloFactory()
    globalApollo = globalApollo || new ApolloFactory()
    return globalApollo
  }

  constructor() {
    this.links = []
    this.fetchMiddleware = []
    this.requestListeners = []
    this.errorListeners = []
    this.client = null
    bindAll(
      this,
      'addLink',
      'addRequestListener',
      'removeRequestListener',
      'addFetchMiddleware',
      'addErrorListener',
      'createFetch',
      'errorHandler',
      'createClient'
    )
  }

  /* <API> */
  addLink(link) {
    if (this.client) return
    this.middleware.push(link)
  }

  addRequestListener(callback) {
    this.requestListeners.push(callback)
  }
  removeRequestListener(callback) {
    const index = this.requestListeners.indexOf(callback)
    if (index !== -1) this.requestListeners.splice(1, index)
  }
  addFetchMiddleware(middleware) {
    if (this.client) return
    this.fetchMiddleware.push(middleware)
  }
  addErrorListener(callback) {
    if (this.client) return
    this.errorListeners.push(callback)
  }
  /* </API> */

  createFetch() {
    const fetchMiddleware = this.fetchMiddleware
    return async (uri, options) => {
      const newOptions = await Promise.reduce(fetchMiddleware, runReducer(uri), options)
      const request = fetch(uri, newOptions)
      this.requestListeners.forEach(listener => listener(request))
      return request
    }
  }
  errorHandler(errorInfo) {
    if (process.browser) {
      const { graphQLErrors, networkError } = errorInfo
      if (graphQLErrors)
        graphQLErrors.map(error => {
          if (error.message.match(ExpectedError.regex)) {
            const alertMessage = error.message.replace(ExpectedError.regex, '')
            graphQLErrors.alert = alert('Error', alertMessage, 'error')
          }
        })
      if (networkError) {
        if (process.browser) {
          alert('Error', 'An unexpected error has occurred. Please try again later.', 'error')
          console.error(JSON.stringify(errorInfo, null, '\t')) // eslint-disable-line no-console
        }
      }
      this.errorListeners.forEach(listener => listener(errorInfo))
    }
  }

  createClient(initialState) {
    if (this.client) return this.client
    const link = concat(
      onError(this.errorHandler),
      ...this.links,
      createHttpLink({
        uri: 'http://localhost:3000/graphql',
        credentials: 'same-origin',
        fetch: this.createFetch(),
      })
    )

    this.client = new ApolloClient({
      connectToDevTools: process.browser,
      ssrMode: process.server, // Disables forceFetch on the server (so queries are only run once)
      link,
      cache: new InMemoryCache().restore(initialState || {}),
    })
    return this.client
  }
}
