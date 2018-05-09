import React from 'react'
import Router from 'next/router'

import { Col, Container, Row } from 'reactstrap'
import { Mutation } from 'react-apollo'

import data from 'app/apollo/data'

import Login from 'app/ui/Form/Login'

class SignIn extends React.Component {
  static title = 'Sign In'
  static authed = false

  componentWillMount() {
    Router.prefetch('/')
  }
  render() {
    return (
      <div className="app flex-row align-items-center">
        <Container>
          <Row className="justify-content-center">
            <Col md="8" lg="5">
              <Mutation {...data.Session.create} fetchPolicy="network-only">
                {createSession => (
                  <Login
                    onSubmit={variables => {
                      createSession({ variables })
                    }}
                  />
                )}
              </Mutation>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default SignIn
