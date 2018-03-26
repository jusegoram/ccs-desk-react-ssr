import React from 'react'
import ReactTable from 'react-table'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'
import _ from 'lodash'

import Page from 'app/ui/Page'
import Layout from 'app/ui/Layout'

class Employees extends React.Component {
  render() {
    const columns = [
      {
        Header: 'Employee',
        columns: [{ Header: 'Name', accessor: 'name' }, { Header: 'Employee ID', accessor: 'externalId' }],
      },
      {
        Header: 'Work Group',
        columns: [{ Header: 'Type', accessor: 'workForces.type' }, { Header: 'Name', accessor: 'workForces.name' }],
      },
    ]
    return (
      <Page title="Dashboard" location={this.props.location}>
        <Layout>
          <Query query={EMPLOYEES}>
            {({ loading, data }) => {
              const tableData =
                data &&
                data.employees &&
                _.flatten(
                  data.employees.map(employee => {
                    if (!employee.workForces || !employee.workForces.length) return [{ employee }]
                    return _.flatten(
                      employee.workForces.map(workForce => {
                        if (!workForce.managers || !workForce.managers.length) return [{ employee, workForce }]
                        return _.flatten(workForce.managers.map(manager => [{ employee, workForce, manager }]))
                      })
                    )
                  })
                )
              return (
                <ReactTable
                  style={{ backgroundColor: 'white', height: 'calc(100vh - 100px)' }}
                  filterable
                  className="-striped -highlight"
                  loading={loading}
                  data={tableData}
                  defaultPageSize={20}
                  columns={columns}
                  defaultFilterMethod={(filter, row) =>
                    String(row[filter.id])
                    .toLowerCase()
                    .indexOf(String(filter.value).toLowerCase()) !== -1
                  }
                />
              )
            }}
          </Query>
        </Layout>
      </Page>
    )
  }
}

const EMPLOYEES = gql`
  query employees {
    employees {
      id
      name
      externalId
      workForces {
        id
        type
        name
      }
    }
  }
`

export default Employees
