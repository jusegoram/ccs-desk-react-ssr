import React from 'react'
import Head from 'next/head'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import Router from 'next/router'

import data from 'app/apollo/data'

import NetworkProgressBar from 'app/ui/Layout/NetworkProgressBar'
import withApolloProvider from 'app/apollo/withApolloProvider'
import { SessionProvider, LocationProvider } from 'app/util/providers'

// Import Main styles for this application
import stylesheet from 'app/styles/index.scss'
import 'react-select/dist/react-select.css'

const Page = withApolloProvider(
  ({ title, redirectAuthedUserTo, redirectUnauthedUserTo = '/sign-in', location, children }) =>
    React.Children.only(
      <div>
        <Head>
          <title>Endeavor Fleet{title && ` | ${title}`}</title>
          <link rel="shortcut icon" type="image/x-icon" href="/static/favicon.ico" />
          <link rel="stylesheet" href="/static/index.fonts.css" />
          <link rel="stylesheet" href="/static/index.styles.css" />
          <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        </Head>
        <LocationProvider location={location}>
          <NetworkProgressBar />
          {!redirectAuthedUserTo && !redirectUnauthedUserTo ? (
            children
          ) : (
            <Query {...data.Session.GET} fetchPolicy="cache-and-network">
              {result => {
                const { loading, data } = result
                console.log('data', data)
                if (redirectUnauthedUserTo && !loading && (!data || !data.session)) {
                  Router.replace(redirectUnauthedUserTo)
                  return null
                }
                if (redirectAuthedUserTo && !loading && data && data.session) {
                  Router.replace(redirectAuthedUserTo)
                  return null
                }
                if (!data && loading) {
                  return <div>Loading...</div>
                }
                return <SessionProvider session={data.session}>{children}</SessionProvider>
              }}
            </Query>
          )}
        </LocationProvider>
      </div>
    )
)

export default Page
