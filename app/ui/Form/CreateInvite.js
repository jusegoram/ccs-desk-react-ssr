import React, { Component } from 'react'

import { Row, Col, CardGroup, Card, CardBody, Button, Input, InputGroup } from 'reactstrap'
import Form from 'app/ui/Form'
import Link from 'next/link'
import * as Icons from 'react-feather'

export default class CreateInvite extends Component {
  state = {
    email: '',
    name: '',
  }
  render() {
    return (
      <CardGroup className="mb-4">
        <Card className="p-4">
          <CardBody>
            <span className="text-center">
              <h1>Invite User</h1>
            </span>
            <p className="text-muted text-center">Invite a new user to use the system</p>
            <Form onSubmit={this.props.onSubmit}>
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
                  autoFocus
                  required
                  onChange={e => this.setState({ email: e.target.value.toLowerCase() })}
                  value={this.state.email}
                />
              </InputGroup>
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
                  required
                  onChange={e => this.setState({ name: e.target.value })}
                  value={this.state.name}
                />
              </InputGroup>
              <Row>
                <Col xs="6">
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
