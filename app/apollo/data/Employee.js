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
}
