import React from 'react'

import { Col, Container, Row } from 'reactstrap'

import Page from 'app/ui/Page'

class SignIn extends React.Component {
  render() {
    return (
      <Page title="Sign In" location={this.props.location} redirectAuthedUserTo="/" redirectUnauthedUserTo={null}>
        <div className="app flex-row align-items-center">
          <Container>
            <Row className="justify-content-center">
              <Col md="8" lg="5">
                Coming Soon
              </Col>
            </Row>
          </Container>
        </div>
      </Page>
    )
  }
}

export default SignIn
