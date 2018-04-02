import React from 'react'
import Head from 'next/head'
import { Query } from 'react-apollo'
import Router from 'next/router'

import data from 'app/apollo/data'

import NetworkProgressBar from 'app/ui/Layout/NetworkProgressBar'
import { SessionProvider, LocationProvider } from 'app/util/providers'

// Import Main styles for this application
import stylesheet from 'app/styles/index.scss'
import 'react-select/dist/react-select.css'

const Page = ({ title, authed = true, location, children }) =>
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
        {authed === null ? (
          children
        ) : (
          <Query {...data.Session.GET} fetchPolicy="cache-and-network">
            {result => {
              const { loading, data } = result
              if (loading && !data.session) return null
              if (authed && !loading && (!data || !data.session)) {
                Router.replace('/sign-in')
                return null
              }
              if (!authed && data && data.session) {
                Router.replace('/')
                return null
              }
              return <SessionProvider session={data.session}>{children}</SessionProvider>
            }}
          </Query>
        )}
      </LocationProvider>
    </div>
  )

export default Page
