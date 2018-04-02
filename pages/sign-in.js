import React from 'react'

import { Col, Container, Row } from 'reactstrap'
import { Mutation } from 'react-apollo'

import data from 'app/apollo/data'

import Page from 'app/ui/Page'
import Login from 'app/ui/Form/Login'

class SignIn extends React.Component {
  render() {
    return (
      <Page title="Sign In" location={this.props.url} authed={false} redirectUnauthedUserTo={null}>
        <div className="app flex-row align-items-center">
          <Container>
            <Row className="justify-content-center">
              <Col md="8" lg="5">
                <Mutation {...data.Session.create}>
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
      </Page>
    )
  }
}

export default SignIn
