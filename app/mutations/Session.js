/* eslint-disable import/prefer-default-export*/

import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const props = `
  id
`

export const Session_logout = graphql(
  gql`
    mutation Session_logout {
      Session_logout {
        ${props}
      }
    }
  `,
  { name: 'Session_logout' }
)
