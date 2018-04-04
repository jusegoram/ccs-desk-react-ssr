/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  type
  name
  managers {
    id
    name
    phoneNumber
    email
  }
`
export default class WorkGroup {
  static props = props
  static QUERY = {
    query: gql`
      query workGroups {
        workGroups {
          ${props}
        }
      }
    `,
  }
  static QUERY_idIn = {
    query: gql`
      query workGroups($ids: [String!]!) {
        workGroups(idIn: $ids) {
          ${props}
        }
      }
    `,
  }
}
