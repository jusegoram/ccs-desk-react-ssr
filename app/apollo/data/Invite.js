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
      mutation Invite_create($email: String!, $name: String!, $role: String!) {
        Invite_create(email: $email, name: $name, role: $role) {
          ${props}
        }
      }
    `,
    refetchQueries: ['session'],
  }

  static accept = {
    mutation: gql`
      mutation Invite_accept($password: String!, $passwordConfirm: String!, $name: String!, $token: String!) {
        Invite_accept(password: $password, passwordConfirm: $passwordConfirm, name: $name, token: $token) {
          ${props}
        }
      }
    `,
    refetchQueries: ['session'],
  }
}
