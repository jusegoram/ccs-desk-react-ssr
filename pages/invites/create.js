import React from 'react'

import gql from 'graphql-tag'
import CreateInvite from 'app/ui/Form/CreateInvite'
import { graphql } from 'react-apollo'
import Router from 'next/router'
import asNextJSPage from 'app/util/asNextJSPage'

class CreateInvitePage extends React.Component {
  async sendInvite(variables) {
    await this.props.createInvite({ variables })
    Router.push('/invites')
  }
  render() {
    return (
      <MainApp location={this.props.location}>
        <CreateInvite onSendInvite={this.sendInvite.bind(this)} />
      </MainApp>
    )
  }
}

// const SESSION = gql`
//   query session {
//     session {
//       id
//     }
//   }
// `

const CREATE_INVITE = graphql(
  gql`
    mutation Invite_create($recipient: String!, $recipientName: String!, $permissions: [PermissionInput]!) {
      Invite_create(recipient: $recipient, recipientName: $recipientName, permissions: $permissions) {
        id
        status
        recipient {
          id
          email
          owner {
            id
            name
          }
        }
      }
    }
  `,
  { name: 'createInvite' }
)

export default asNextJSPage(CreateInvitePage)
