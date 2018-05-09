import React from 'react'

import { Col, Container, Row } from 'reactstrap'

import asNextJSPage from 'app/util/asNextJSPage'
import ForgotPasswordForm from 'app/ui/Form/ForgotPassword'

class ForgotPassword extends React.Component {
  static title = 'Forgot Password'
  static authed = false
  render() {
    return (
      <div className="app flex-row align-items-center">
        <Container>
          <Row className="justify-content-center">
            <Col md="8" lg="5">
              <ForgotPasswordForm />
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default ForgotPassword
