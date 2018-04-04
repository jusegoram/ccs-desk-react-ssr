/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  name
  role
  externalId
  phoneNumber
  email
  company {
    id
    name
  }
  workGroups {
    id
  }
`
export default class Employee {
  static props = props
  static QUERY = {
    query: gql`
      query employees {
        employees {
          ${props}
        }
      }
    `,
  }
  static GET = {
    query: gql`
      query employee($id: String!) {
        employee(id: $id) {
          ${props}
        }
      }
    `,
  }
}
