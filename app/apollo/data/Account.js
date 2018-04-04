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
}
