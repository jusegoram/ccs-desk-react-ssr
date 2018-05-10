import React, { Component } from 'react'
import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import alert from 'sweetalert'
import * as Icons from 'react-feather'

export default class LoginForm extends Component {
  state = {
    name: '',
    password: '',
    passwordConfirm: '',
  }
  render() {
    return (
      <CardGroup className="mb-4">
        <Card className="p-4">
          <CardBody>
            <Form onSubmit={this.props.onSubmit}>
              <span className="text-center">
                <h1>Accept Invite</h1>
              </span>
              <p className="text-muted text-center">Create your new account</p>
              <InputGroup className="mb-4">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <Icons.User size={15} />
                  </span>
                </div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  name="name"
                  autoFocus
                  required
                  onChange={e => this.setState({ name: e.target.value })}
                  value={this.state.name}
                />
              </InputGroup>{' '}
              <InputGroup className="mb-4">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <Icons.Lock size={15} />
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="Password"
                  name="password"
                  autoComplete="off"
                  required
                  onChange={e => this.setState({ password: e.target.value })}
                  value={this.state.password}
                />
              </InputGroup>
              <InputGroup className="mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <Icons.Lock size={15} />
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  name="passwordConfirm"
                  autoComplete="off"
                  required
                  onChange={e => this.setState({ passwordConfirm: e.target.value })}
                  value={this.state.passwordConfirm}
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
