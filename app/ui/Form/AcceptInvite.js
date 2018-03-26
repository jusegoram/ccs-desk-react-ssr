import React, { Component } from 'react'
import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import alert from 'sweetalert'

export default class LoginForm extends Component {
  constructor(props) {
    super(props)
    this.onSubmit = this.onSubmit.bind(this)
    this.state = {
      password: '',
      confirmPassword: '',
    }
  }
  onSubmit(fields) {
    if (fields.password !== fields.confirmPassword) {
      this.setState({ password: '', confirmPassword: '' })
      alert('Incorrect Confirmation', 'Please ensure that your password and password confirmation match.', 'error')
      return
    }
    return this.props.onSubmit(fields)
  }
  render() {
    return (
      <CardGroup className="mb-4">
        <Card className="p-4">
          <CardBody>
            <h1>Set Password</h1>
            <Form onSubmit={this.onSubmit}>
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
                  autoComplete="off"
                  autoFocus
                  required
                  onChange={e => this.setState({ password: e.target.value })}
                  value={this.state.password}
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
                  autoComplete="off"
                  required
                  onChange={e => this.setState({ confirmPassword: e.target.value })}
                  value={this.state.confirmPassword}
                />
              </InputGroup>
              <Row>
                <Col>
                  <Button color="primary" className="px-4">
                    Accept
                  </Button>
                </Col>
              </Row>
            </Form>
          </CardBody>
        </Card>
      </CardGroup>
    )
  }
}
