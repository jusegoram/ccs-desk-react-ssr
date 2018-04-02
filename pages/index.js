import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody } from 'reactstrap'

import withApolloProvider from 'app/apollo/withApolloProvider'
import data from 'app/apollo/data'

import Page from 'app/ui/Page'
import Layout from 'app/ui/Layout'

class Timecards extends React.Component {
  render() {
    const columns = [
      { Header: 'Employee', accessor: 'employee.name' },
      {
        Header: 'Shift Length',
        id: 'shiftLength',
        accessor: row => moment(row.clockedOutAt).diff(row.clockedInAt, 'hours', true),
        Cell: ({ row }) =>
          moment(row.clockedOutAt)
          .diff(row.clockedInAt, 'hours', true)
          .toFixed(1) + ' hours',
      },
      {
        Header: 'Clocked In At',
        id: 'clockedInAt',
        accessor: row => moment(row.clockedInAt).valueOf(),
        Cell: ({ row }) => moment(row.clockedInAt).format('h:mm A on MMMM Do'),
      },
      {
        Header: 'Clocked Out At',
        id: 'clockedOutAt',
        accessor: row => moment(row.clockedOutAt).valueOf(),
        Cell: ({ row }) => moment(row.clockedOutAt).format('h:mm A on MMMM Do'),
      },
    ]
    return (
      <Page title="Dashboard" location={this.props.url}>
        <Layout>
          <Query {...data.Timecard.QUERY} fetchPolicy="cache-and-network" pollInterval={5000}>
            {({ loading, data }) => {
              return (
                <Card>
                  <CardHeader>
                    <i className="icon-menu" /> Timecards
                    <div className="card-actions">
                      <a href="#">
                        <i className="fa fa-download fa-lg" />
                      </a>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ReactTable
                      style={{ backgroundColor: 'white', height: 'calc(100vh - 100px)' }}
                      filterable
                      className="-striped -highlight"
                      loading={!data.timecards && loading}
                      data={data && data.timecards}
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

export default withApolloProvider(Timecards)
