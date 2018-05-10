import React from 'react'
import Router from 'next/router'

import { Col, Container, Row } from 'reactstrap'
import { Mutation } from 'react-apollo'
import Layout from 'app/ui/Layout'

import data from 'app/apollo/data'

import CreateInvite from 'app/ui/Form/CreateInvite'
import alert from 'sweetalert'

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
                  {mutate => (
                    <CreateInvite
                      onSubmit={async variables => {
                        await mutate({ variables })
                        await alert('Sent Invite', 'An invite has been sent to the specified recipient', 'success')
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
