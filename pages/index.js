import React from 'react'

import Page from 'app/ui/Page'
import Layout from 'app/ui/Layout'

class Dashboard extends React.Component {
  render() {
    return (
      <Page title="Dashboard" location={this.props.location}>
        <Layout>Welcome to CCS Desk. Use the navbar on the left to navigate.</Layout>
      </Page>
    )
  }
}

export default Dashboard
