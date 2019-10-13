/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  name
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
        techs {
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
      query tech($id: String!) {
        tech(id: $id) {
          ${props}
        }
      }
    `,
  }
}
