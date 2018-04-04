/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  account {
    id
    name
  }
  rootAccount {
    id
    name
  }
`
export default class Session {
  static props = props
  static GET = {
    query: gql`
      query session {
        session {
          ${props}
        }
      }
    `,
  }

  static create = {
    mutation: gql`
      mutation Session_create($email: String!, $password: String!) {
        Session_create(email: $email, password: $password) {
          ${props}
        }
      }
    `,
    refetchQueries: ['session'],
  }

  static logout = {
    mutation: gql`
      mutation Session_logout {
        Session_logout {
          ${props}
        }
      }
    `,
  }
}
