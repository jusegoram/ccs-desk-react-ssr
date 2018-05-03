/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  name
  company {
    id
    name
  }
`
export default class Account {
  static props = props
  static QUERY = {
    query: gql`
      query accounts {
        accounts {
          ${props}
        }
      }
    `,
  }
  static M_requestPasswordReset = {
    mutation: gql`
      mutation Account_requestPasswordReset($email: String!){
        Account_requestPasswordReset(email: $email){
          ${props}
        }
      }
    `,
  }
  static M_resetPassword = {
    mutation: gql`
      mutation Account_resetPassword($token: String!, $password: String!){
        Account_resetPassword(token: $token, password: $password){
          ${props}
        }
      }
    `,
  }
}
