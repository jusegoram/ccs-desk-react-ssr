import React, { Component } from 'react'

import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import Link from 'next/link'

class LoginForm extends Component {
  state = {
    email: '',
    password: '',
  }
  render() {
    return (
      <CardGroup className="mb-4">
        <Card className="p-4">
          <CardBody>
            <h1>Sign In</h1>
            <p className="text-muted">Login to your account</p>
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
              <InputGroup className="mb-4">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <i className="icon-lock" />
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="Password"
                  name="password"
                  required
                  innerRef={passwordInput => (this.passwordInput = passwordInput)}
                  onChange={e => this.setState({ password: e.target.value })}
                  value={this.state.password}
                  onFocus={() => {
                    this.setState({ password: '' })
                  }}
                />
              </InputGroup>
              <Row>
                <Col xs="6">
                  <Button color="primary" className="px-4">
                    Login
                  </Button>
                </Col>
                <Col xs="6" className="text-right">
                  <Link shallow href="/forgot-password">
                    <Button color="link" className="px-0">
                      Forgot password?
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

export default LoginForm
