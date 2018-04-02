/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  claimedAt
  returnedAt
  vehicle {
    id
    externalId
  }
  employee {
    id
    name
  }
`
export default class VehicleClaim {
  static props = props
  static QUERY = {
    query: gql`
      query vehicleClaims {
        vehicleClaims {
          ${props}
        }
      }
    `,
  }
}
