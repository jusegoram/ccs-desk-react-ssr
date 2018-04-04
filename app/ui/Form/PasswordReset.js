import React, { Component } from 'react'
import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import alert from 'sweetalert'
import { Mutation } from 'react-apollo'
import ApolloData from 'app/apollo/data'
import Router from 'next/router'

export default class PasswordReset extends Component {
  state = {
    password: '',
    confirmPassword: '',
  }
  render() {
    const { password, confirmPassword } = this.state
    const { token } = this.props
    return (
      <CardGroup className="mb-4">
        <Card className="p-4">
          <CardBody>
            <h1>Reset Password</h1>
            <p className="text-muted">Enter your new password</p>
            <Mutation {...ApolloData.Account.M_resetPassword}>
              {resetPassword => (
                <Form
                  onSubmit={async () => {
                    const { password, confirmPassword } = this.state
                    if (password !== confirmPassword) {
                      await alert(
                        'Incorrect Confirmation',
                        'Please ensure that your password and password confirmation match.',
                        'error'
                      )
                      return
                    }
                    await resetPassword({ variables: { password, token } })
                    alert('Success', 'Your password has been reset. Sign in to continue.')
                    Router.replace('/')
                  }}
                >
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
                      autoFocus
                      required
                      onChange={e => this.setState({ password: e.target.value })}
                      value={password}
                    />
                  </InputGroup>
                  <InputGroup className="mb-3">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <i className="icon-lock" />
                      </span>
                    </div>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      name="confirmPassword"
                      required
                      onChange={e => this.setState({ confirmPassword: e.target.value })}
                      value={confirmPassword}
                    />
                  </InputGroup>
                  <Row>
                    <Col>
                      <Button color="primary" className="px-4">
                        Reset
                      </Button>
                    </Col>
                  </Row>
                </Form>
              )}
            </Mutation>
          </CardBody>
        </Card>
      </CardGroup>
    )
  }
}
