/* eslint-disable import/prefer-default-export*/

import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const props = `
  id
  name
`

export const Account_login = graphql(
  gql`
    mutation Account_login($email: String!, $password: String!) {
      Account_login(email: $email, password: $password) {
        id
        account {
          ${props}
        }
      }
    }
  `,
  { name: 'Account_login' }
)
