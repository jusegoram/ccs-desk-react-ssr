import React from 'react'

import Head from 'next/head'
import { Query, ApolloProvider, getDataFromTree } from 'react-apollo'
import Router from 'next/router'

import NetworkProgressBar from 'app/ui/Layout/NetworkProgressBar'
import { SessionProvider, LocationProvider } from 'app/util/providers'

import ApolloFactory from 'app/apollo/ApolloFactory'
import data from 'app/apollo/data'

import Loader from 'app/ui/Loader'
import cookie from 'cookie'
import moment from 'moment-timezone'
import axios from 'axios'
import stylesheet from 'app/styles/index.scss'
import 'react-select/dist/react-select.css'
import App, { Container } from 'next/app'

function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown'
}

export default class CCSApp extends App {
  // https://github.com/zeit/next.js/#fetching-data-and-component-lifecycle
  static async getInitialProps({ Component, router, ctx }) {
    const location = {
      asPath: ctx.asPath,
      pathname: ctx.pathname,
      query: ctx.query,
    }

    let serverSideApolloState = undefined
    if (process.server) {
      try {
        const client = ApolloFactory.getInstance().createClient()
        // Run all GraphQL queries
        await getDataFromTree(Component.getReactNode({ location, apollo: client }), { router })
        serverSideApolloState = client.extract()
      } catch (error) {
        console.error('There was a server-side error fetching data with apollo') // eslint-disable-line no-console
        console.error(error) // eslint-disable-line no-console
        // Prevent Apollo Client GraphQL errors from crashing SSR.
        // Handle them in components via the data.error prop:
        // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
      }
      // getDataFromTree does not call componentWillUnmount
      // head side effect therefore need to be cleared manually
      Head.rewind()
    }

    return {
      serverSideApolloState,
      location,
    }
  }

  constructor(props) {
    super(props)
    this.apollo = ApolloFactory.getInstance().createClient(this.props.serverSideApolloState)
  }

  static getReactNode(Component, { location, apollo }) {
    if (process.browser) {
      document.cookie = cookie.serialize('timezone', moment.tz.guess(), { path: '/' })

      // axios.interceptors.request.use(config => {
      //   config.headers.timezone = timezone
      //   return config
      // })
    }
    return (
      <div>
        <Head>
          <title>CCS Desk{Component.title && ` | ${Component.title}`}</title>
          <link rel="shortcut icon" type="image/x-icon" href="/static/favicon.ico" />
          <link rel="stylesheet" href="/static/index.fonts.css" />
          <link rel="stylesheet" href="/static/index.styles.css" />
          <link rel="stylesheet" href="https://unpkg.com/react-vis/dist/style.css" />
          <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        </Head>
        <ApolloProvider client={apollo}>
          <LocationProvider location={location}>
            <NetworkProgressBar />
            <Query {...data.Session.GET} fetchPolicy="cache-and-network">
              {result => {
                const { loading, data } = result
                if (loading && !data.session) return <Loader />
                if (Component.authed && !loading && (!data || !data.session)) {
                  Router.replace('/')
                  return null
                }
                if (Component.authed === false && data && data.session) {
                  Router.replace('/data/work-orders')
                  return null
                }
                return (
                  <SessionProvider session={data.session}>
                    <Component location={location} session={data.session} />
                  </SessionProvider>
                )
              }}
            </Query>
          </LocationProvider>
        </ApolloProvider>
      </div>
    )
  }

  render() {
    const { Component, location } = this.props
    if (Component.authed === undefined) Component.authed = true
    return <Container>{CCSApp.getReactNode(Component, { location, apollo: this.apollo })}</Container>
  }
}
