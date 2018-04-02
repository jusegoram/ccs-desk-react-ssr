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
      { Header: 'Name', accessor: 'name' },
      { Header: 'Employee ID', accessor: 'externalId' },
      { Header: 'Phone Number', accessor: 'phoneNumber' },
    ]
    return (
      <Page title="Dashboard" location={this.props.location}>
        <Layout>
          <Query query={EMPLOYEES}>
            {({ loading, data }) => {
              return (
                <ReactTable
                  style={{ backgroundColor: 'white', height: 'calc(100vh - 100px)' }}
                  filterable
                  className="-striped -highlight"
                  loading={loading}
                  data={data && data.employees}
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
      phoneNumber
    }
  }
`

export default Employees
