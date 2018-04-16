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
    name
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
  static QUERY_todaysTechImports = {
    query: gql`
      query dataImports($createdAtGte: String!, $createdAtLt: String!) {
        dataImports(reportName: "${
          reports.techs
        }", orderByDesc: createdAt, createdAtGte: $createdAtGte, createdAtLt: $createdAtLt) {
          ${props}
        }
      }
    `,
  }
  static QUERY_todaysWorkOrderImports = {
    query: gql`
      query dataImports($date: String!) {
        dataImports(reportNameIn: ${JSON.stringify(reports.workOrders)}, orderByDesc: createdAt, date: $date) {
          ${props}
        }
      }
    `,
  }
}
