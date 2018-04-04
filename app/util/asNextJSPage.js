import React from 'react'

import Head from 'next/head'
import { Query, ApolloProvider, getDataFromTree } from 'react-apollo'
import Router from 'next/router'

import NetworkProgressBar from 'app/ui/Layout/NetworkProgressBar'
import { SessionProvider, LocationProvider } from 'app/util/providers'

import ApolloFactory from 'app/apollo/ApolloFactory'
import data from 'app/apollo/data'

import stylesheet from 'app/styles/index.scss'
import 'react-select/dist/react-select.css'

function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown'
}

export default Component => {
  if (Component.authed === undefined) Component.authed = true
  return class AsNextJSPage extends React.Component {
    static displayName = `AsNextJSPage(${getComponentDisplayName(Component)})`

    // https://github.com/zeit/next.js/#fetching-data-and-component-lifecycle
    static async getInitialProps(ctx) {
      const initialProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {}
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
          await getDataFromTree(
            <ApolloProvider client={client}>
              <Component {...initialProps} />
            </ApolloProvider>,
            {
              router: location,
            }
          )
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
        ...initialProps,
      }
    }

    constructor(props) {
      super(props)
      this.apollo = ApolloFactory.getInstance().createClient(this.props.serverSideApolloState)
    }

    render() {
      const { location } = this.props
      return React.Children.only(
        <div>
          <Head>
            <title>CCS Desk{Component.title && ` | ${Component.title}`}</title>
            <link rel="shortcut icon" type="image/x-icon" href="/static/favicon.ico" />
            <link rel="stylesheet" href="/static/index.fonts.css" />
            <link rel="stylesheet" href="/static/index.styles.css" />
            <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
          </Head>
          <ApolloProvider client={this.apollo}>
            <LocationProvider location={location}>
              <NetworkProgressBar />
              <Query {...data.Session.GET} fetchPolicy="cache-and-network">
                {result => {
                  const { loading, data } = result
                  if (loading && !data.session) return null
                  if (Component.authed && !loading && (!data || !data.session)) {
                    Router.replace('/sign-in')
                    return null
                  }
                  if (Component.authed === false && data && data.session) {
                    Router.replace('/')
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
  }
}
