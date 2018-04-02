import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import moment from 'moment-timezone'

import data from 'app/apollo/data'

import Page from 'app/ui/Page'
import Layout from 'app/ui/Layout'

class Timecards extends React.Component {
  render() {
    const columns = [
      { Header: 'Employee', accessor: 'employee.name' },
      { Header: 'Vehicle ID', accessor: 'vehicle.externalId' },
      {
        Header: 'Claim Length',
        id: 'claimLength',
        accessor: row => moment(row.returnedAt).diff(row.claimedAt, 'hours', true),
        Cell: ({ row }) =>
          moment(row.returnedAt)
          .diff(row.claimedAt, 'hours', true)
          .toFixed(1) + ' hours',
      },
      {
        Header: 'Claimed At',
        id: 'claimedAt',
        accessor: row => moment(row.claimedAt).valueOf(),
        Cell: ({ row }) => moment(row.claimedAt).format('h:mm A on MMMM Do'),
      },
      {
        Header: 'Returned At',
        id: 'returnedAt',
        accessor: row => moment(row.returnedAt).valueOf(),
        Cell: ({ row }) => moment(row.returnedAt).format('h:mm A on MMMM Do'),
      },
    ]
    return (
      <Page title="Dashboard" location={this.props.url}>
        <Layout>
          <Query {...data.VehicleClaim.QUERY} fetchPolicy="cache-and-network" pollInterval={5000}>
            {({ loading, data }) => {
              return (
                <ReactTable
                  style={{ backgroundColor: 'white', height: 'calc(100vh - 100px)' }}
                  filterable
                  className="-striped -highlight"
                  loading={loading}
                  data={data && data.vehicleClaims}
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

export default Timecards
