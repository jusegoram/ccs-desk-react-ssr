/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  clockedInAt
  clockedOutAt
  employee {
    id
    name
  }
`
export default class Timecard {
  static props = props
  static QUERY = {
    query: gql`
      query timecards {
        timecards {
          ${props}
        }
      }
    `,
  }
}
