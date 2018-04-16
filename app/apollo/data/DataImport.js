/* @flow */
import gql from 'graphql-tag'

const props = `
  id
  reportName
  createdAt
  status
  downloadedAt
  completedAt
  dataSource {
    id
    company {
      id
      name
    }
  }
`
export default class DataImport {
  static props = props
  static QUERY_recentTechImports = {
    query: gql`
      query dataImports($limit: Int!) {
        dataImports(reportName: "Tech Profile", orderByDesc: createdAt, limit: $limit) {
          ${props}
        }
      }
    `,
  }
  static QUERY_recentWorkOrderImports = {
    query: gql`
      query dataImports($limit: Int!) {
        dataImports(reportNameIn: ["Routelog", "MW Routelog", "SE Routelog", "SW Routelog", "W Routelog"], orderByDesc: createdAt, limit: $limit) {
          ${props}
        }
      }
    `,
  }
}
