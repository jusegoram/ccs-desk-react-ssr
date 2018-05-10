import React from 'react'
import Router from 'next/router'

import { Col, Container, Row } from 'reactstrap'
import { Mutation } from 'react-apollo'
import Layout from 'app/ui/Layout'

import data from 'app/apollo/data'
import alert from 'sweetalert'

import AcceptInvite from 'app/ui/Form/AcceptInvite'

export default class AcceptInvitePage extends React.Component {
  static title = 'Sign In'
  static authed = false

  render() {
    const token = this.props.location.asPath.split('/').slice(-1)[0]
    return (
      <Container>
        <Row className="justify-content-center">
          <Col xs="12" md="8" lg="5">
            <Mutation {...data.Invite.accept} fetchPolicy="network-only">
              {mutate => (
                <AcceptInvite
                  onSubmit={async variables => {
                    await mutate({ variables: { ...variables, token } })
                    await alert(
                      'Account Created',
                      'Your account has been created. Please log in to continue.',
                      'success'
                    )
                    Router.push('/')
                  }}
                />
              )}
            </Mutation>
          </Col>
        </Row>
      </Container>
    )
  }
}
