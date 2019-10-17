/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  type
  name
  externalId
`
// managers {
//   id
//   name
//   phoneNumber
//   email
// }

export default class WorkGroup {
  static props = props
  static QUERY = {
    query: gql`
      query workGroups($order: Float) {
        workGroups(order: $order) {
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
  static QUERY_workGroupTechs = {
    query: gql`
      query workGroup($id: String!) {
        workGroup(id: $id) {
          ${props}
        }
      }
    `,
  }
}
