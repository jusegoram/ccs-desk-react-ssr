import React from 'react'

import { ApolloProvider, getDataFromTree } from 'react-apollo'
import Head from 'next/head'
import ApolloFactory from 'app/apollo/ApolloFactory'

function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown'
}

export default Component => {
  return class WithApolloProvider extends React.Component {
    static displayName = `WithApolloProvider(${getComponentDisplayName(Component)})`

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
      const { serverSideApolloState, ...props } = this.props
      return (
        <ApolloProvider client={this.apollo}>
          <Component {...props} />
        </ApolloProvider>
      )
    }
  }
}
