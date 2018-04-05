/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  name
  role
  externalId
  phoneNumber
  email
  skills
  schedule
  terminatedAt
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
  static QUERY_techs = {
    query: gql`
      query techs {
        employees(role: "Tech") {
          ${props}
        }
      }
    `,
  }
  static QUERY_managers = {
    query: gql`
      query managers {
        employees(role: "Manager") {
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
