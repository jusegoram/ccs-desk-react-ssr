import React, { Component } from 'react'
import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import Link from 'next/link'

export default class ForgotPasswordForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      email: '',
    }
  }
  render() {
    return (
      <CardGroup className="mb-4">
        <Card className="p-4">
          <CardBody>
            <h1>Forgot Password</h1>
            <p className="text-muted">Send a reset link to your email</p>
            <Form onSubmit={this.props.onSubmit}>
              <InputGroup className="mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <i className="icon-user" />
                  </span>
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  name="email"
                  autoComplete="off"
                  autoFocus
                  required
                  onChange={e => this.setState({ email: e.target.value })}
                  value={this.state.email}
                />
              </InputGroup>
              <Row>
                <Col xs="6">
                  <Button color="primary" className="px-4">
                    Send
                  </Button>
                </Col>
                <Col xs="6" className="text-right">
                  <Link href="/sign-in">
                    <Button color="link" className="px-0">
                      Back to Sign In
                    </Button>
                  </Link>
                </Col>
              </Row>
            </Form>
          </CardBody>
        </Card>
      </CardGroup>
    )
  }
}
