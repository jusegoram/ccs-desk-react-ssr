import React, { Component } from 'react'

import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import Link from 'next/link'
import * as Icons from 'react-feather'

export default class CreateInvite extends Component {
  state = {
    email: '',
    name: '',
    role: 'Admin',
  }
  render() {
    return (
      <CardGroup>
        <Card className="p-4">
          <CardBody>
            <span className="text-center">
              <h1>Invite User</h1>
            </span>
            <p className="text-muted text-center">Invite a new user to use the system</p>
            <Form onSubmit={this.props.onSubmit}>
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
              </InputGroup>
              <InputGroup className="mb-4">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <Icons.Shield size={15} />
                  </span>
                </div>
                <Input
                  type="select"
                  name="role"
                  required
                  onChange={e => this.setState({ role: e.target.value })}
                  value={this.state.role}
                >
                  <option>Admin</option>
                  <option>Auditor</option>
                  <option>Manager</option>
                  <option>Supervisor</option>
                </Input>
              </InputGroup>
              <InputGroup className="mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <Icons.AtSign size={15} />
                  </span>
                </div>
                <Input
                  type="email"
                  placeholder="Recipient Email"
                  name="email"
                  autoComplete="off"
                  required
                  onChange={e => this.setState({ email: e.target.value.toLowerCase() })}
                  value={this.state.email}
                />
              </InputGroup>
              <Row>
                <Col className="text-center">
                  <Button color="primary" className="px-4">
                    Invite
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
