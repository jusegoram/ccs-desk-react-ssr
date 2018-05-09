import React from 'react'

import { Col, Container, Row } from 'reactstrap'
import { compose, graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Page from 'app/ui/Page'
import AcceptInviteForm from 'app/ui/Form/AcceptInvite'

import wrappedByApolloProvider from 'app/apolloUtils/wrappedByApolloProvider'
import { POLL_SESSION } from 'app/data/queries/session'
import alert from 'sweetalert'
import redirect from 'app/util/redirect'
import withEnvVars from 'app/util/withEnvVars'
import { SessionProvider } from 'app/data/providers/session'
import { LocationProvider } from 'app/util/providers/location'
import { RESET_PASSWORD } from 'app/data/queries/user'
import Layout from 'app/ui/Layout'

class AcceptInvite extends React.Component {
  static async getInitialProps({ req }) {
    return {
      inviteToken: req && req.inviteToken,
    }
  }
  constructor(props) {
    super(props)
    if (process.browser) {
      this.inviteToken = this.inviteToken || props.inviteToken
      if (!props.inviteToken) {
        redirect('/')
      } else if (props.url.asPath !== '/invites/accept') {
        props.url.replace('/invites/accept')
      }
    }
    this.state = {}
    this.acceptInvite = this.acceptInvite.bind(this)
  }

  async acceptInvite(fields) {
    const { password } = fields
    const token = this.inviteToken
    const variables = { password, token }
    await this.props.acceptInvite({ variables })
    await alert('Success', 'You have successfully registered an account. Sign in to continue.')
    redirect('/sign-in')
  }

  render() {
    const { location, session, ...props } = this.props
    return (
      <Page title="Accept Invite" {...props}>
        <div className="app flex-row align-items-center">
          <Container>
            <Row className="justify-content-center">
              <Col md="8" lg="5">
                <AcceptInviteForm onSubmit={this.acceptInvite} />
              </Col>
            </Row>
          </Container>
        </div>
      </Page>
    )
  }
}

const ACCEPT_INVITE = graphql(
  gql`
    mutation Invite_accept($token: String!, $password: String!) {
      Invite_accept(token: $token, password: $password) {
        id
      }
    }
  `,
  { name: 'acceptInvite' }
)

export default compose(ACCEPT_INVITE)(AcceptInvite)
