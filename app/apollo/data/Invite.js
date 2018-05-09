/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  name
  email
  status
`
export default class Invite {
  static props = props
  static QUERY = {
    query: gql`
      query invites {
        invites {
          ${props}
        }
      }
    `,
  }

  static create = {
    mutation: gql`
      mutation Invite_create($email: String!, $name: String!) {
        Invite_create(email: $email, name: $name) {
          ${props}
        }
      }
    `,
    refetchQueries: ['session'],
  }
}
