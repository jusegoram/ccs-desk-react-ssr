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
  tempClaimId
  tempClaimTeamId
  tempClaimTeamName
  tempClaimTeamPhone
  tempClaimFromDate
  tempClaimToDate
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

  static GET = {
    query: gql`
      query tech($id: String!) {
        tech(id: $id) {
          ${props}
        }
      }
    `,
  }

  static QUERY_workgroupTechs = {
    query: gql`
      query tech($id: String!) {
        tech(id: $id) {
          ${props}
        }
      }
    `,
  }
}
