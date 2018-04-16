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
const reports = {
  techs: 'Tech Profile',
  workOrders: ['Routelog', 'MW Routelog', 'SE Routelog', 'SW Routelog', 'W Routelog'],
}
export default class DataImport {
  static props = props
  static QUERY_recentTechImports = {
    query: gql`
      query dataImports($limit: Int!) {
        dataImports(reportName: "${reports.techs}", orderByDesc: createdAt, limit: $limit) {
          ${props}
        }
      }
    `,
  }
  static QUERY_recentWorkOrderImports = {
    query: gql`
      query dataImports($limit: Int!) {
        dataImports(reportNameIn: ${JSON.stringify(reports.workOrders)}, orderByDesc: createdAt, limit: $limit) {
          ${props}
        }
      }
    `,
  }
}
