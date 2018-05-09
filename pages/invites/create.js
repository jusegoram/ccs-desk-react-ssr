import React from 'react'
import Router from 'next/router'

import { Col, Container, Row } from 'reactstrap'
import { Mutation } from 'react-apollo'
import Layout from 'app/ui/Layout'

import data from 'app/apollo/data'

import CreateInvite from 'app/ui/Form/CreateInvite'

export default class CreateInvitePage extends React.Component {
  static title = 'Sign In'

  render() {
    return (
      <Layout>
        <div className="">
          <Container>
            <Row className="justify-content-center">
              <Col xs="12" md="8" lg="5">
                <Mutation {...data.Invite.create} fetchPolicy="network-only">
                  {createSession => (
                    <CreateInvite
                      onSubmit={variables => {
                        createSession({ variables })
                      }}
                    />
                  )}
                </Mutation>
              </Col>
            </Row>
          </Container>
        </div>
      </Layout>
    )
  }
}
