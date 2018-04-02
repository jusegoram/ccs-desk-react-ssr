import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody } from 'reactstrap'

import withApolloProvider from 'app/apollo/withApolloProvider'
import data from 'app/apollo/data'

import Page from 'app/ui/Page'
import Layout from 'app/ui/Layout'

class VehicleClaims extends React.Component {
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
                <Card>
                  <CardHeader>
                    <i className="icon-menu" />Vehicle Claims
                    <div className="card-actions">
                      <a href="#">
                        <i className="fa fa-download fa-lg" />
                      </a>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <ReactTable
                      style={{ backgroundColor: 'white', height: 'calc(100vh - 146px)' }}
                      filterable
                      className="-striped -highlight"
                      loading={!data.vehicleClaims && loading}
                      data={data && data.vehicleClaims}
                      defaultPageSize={20}
                      columns={columns}
                      defaultFilterMethod={(filter, row) =>
                        String(row[filter.id])
                        .toLowerCase()
                        .indexOf(String(filter.value).toLowerCase()) !== -1
                      }
                    />
                  </CardBody>
                </Card>
              )
            }}
          </Query>
        </Layout>
      </Page>
    )
  }
}

export default withApolloProvider(VehicleClaims)
