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
      {
        Header: 'Clocked In At',
        id: 'clockedInAt',
        accessor: row => moment(row.clockedInAt).valueOf(),
        Cell: ({ row }) => moment(row.clockedInAt).format('h:mm A'),
      },
      {
        Header: 'Clocked Out At',
        id: 'clockedOutAt',
        accessor: row => moment(row.clockedOutAt).valueOf(),
        Cell: ({ row }) => moment(row.clockedOutAt).format('h:mm A'),
      },
      {
        Header: 'Shift Length',
        id: 'shiftLength',
        accessor: row => moment(row.clockedOutAt).diff(row.clockedInAt, 'hours', true),
        Cell: ({ row }) =>
          moment(row.clockedOutAt)
          .diff(row.clockedInAt, 'hours', true)
          .toFixed(1) + ' hours',
      },
    ]
    return (
      <Page title="Dashboard" location={this.props.location}>
        <Layout>
          <Query {...data.Timecard.QUERY}>
            {({ loading, data }) => {
              return (
                <ReactTable
                  style={{ backgroundColor: 'white', height: 'calc(100vh - 100px)' }}
                  filterable
                  className="-striped -highlight"
                  loading={loading}
                  data={data && data.timecards}
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
