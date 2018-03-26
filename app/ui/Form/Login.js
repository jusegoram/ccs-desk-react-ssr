import React, { Component } from 'react'
import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import Link from 'next/link'
import Router from 'next/router'
import { Account_login } from 'app/mutations/Account'

class LoginForm extends Component {
  constructor(props) {
    super(props)
    this.onSubmit = this.onSubmit.bind(this)
    this.state = {
      email: 'timhuff@gmail.com',
      password: 'asdf',
    }
  }
  async onSubmit(variables) {
    try {
      const result = await this.props.Account_login({ variables })
      if (result.data.Account_login) Router.push('/')
    } catch (e) {
      const alertShown = e.graphQLErrors && e.graphQLErrors.alert
      if (alertShown)
        alertShown.then(() => {
          this.setState({ password: '' })
          this.passwordInput.focus()
        })
      throw e
    }
  }
  render() {
    return (
      <CardGroup className="mb-4">
        <Card className="p-4">
          <CardBody>
            <h1>Sign In</h1>
            <p className="text-muted">Login to your account</p>
            <Form onSubmit={this.onSubmit}>
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
                />
              </InputGroup>
              <Row>
                <Col xs="6">
                  <Button color="primary" className="px-4">
                    Login
                  </Button>
                </Col>
                <Col xs="6" className="text-right">
                  <Link href="/forgot-password">
                    <Button color="link" className="px-0">
                      Forgot password?
                    </Button>
                  </Link>
                </Col>
              </Row>
            </Form>
          </CardBody>
        </Card>
        {/* <Card className="text-white bg-primary py-5 d-md-down-none" style={{ width: 44 + '%' }}>
                  <CardBody className="text-center">
                    <div>
                      <h2>Sign up</h2>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua.
                      </p>
                      <Button color="primary" className="mt-3" active>
                        Register Now!
                      </Button>
                    </div>
                  </CardBody>
                </Card> */}
      </CardGroup>
    )
  }
}

export default Account_login(LoginForm)
