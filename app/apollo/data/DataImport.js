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
  techs: 'Tech Report',
  workOrders: [
    'SDCR',
    'Siebel Work Order Report',
    'Edge MW Work Order Report',
    'Edge SE Work Order Report',
    'Edge SW Work Order Report',
    'Edge W Work Order Report',
  ],
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
      query dataImports($createdAtGte: String!, $createdAtLt: String!) {
        dataImports(reportNameIn: ${JSON.stringify(
      reports.workOrders
    )}, orderByDesc: createdAt, createdAtGte: $createdAtGte, createdAtLt: $createdAtLt) {
          ${props}
        }
      }
    `,
  }
}
