import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Button } from 'reactstrap'
import alert from 'sweetalert'

import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'

class Timecards extends React.Component {
  render() {
    const columns = [
      { Header: 'Employee', accessor: 'employee.name' },
      {
        Header: 'Shift Length',
        id: 'shiftLength',
        accessor: row => moment(row.clockedOutAt || undefined).diff(row.clockedInAt, 'hours', true),
        Cell: ({ row }) =>
          moment(row.clockedOutAt || undefined)
          .diff(row.clockedInAt, 'hours', true)
          .toFixed(1) + ' hours',
      },
      {
        Header: 'Clocked In At',
        id: 'clockedInAt',
        accessor: row => row.clockedInAt,
        Cell: ({ row }) => (row.clockedInAt ? moment(row.clockedInAt).format('h:mm A on MMMM Do') : null),
      },
      {
        Header: 'Clocked Out At',
        id: 'clockedOutAt',
        accessor: row => row.clockedOutAt,
        Cell: ({ row }) => (row.clockedOutAt ? moment(row.clockedOutAt).format('h:mm A on MMMM Do') : null),
      },
    ]
    return (
      <Layout>
        <Query {...data.Timecard.QUERY} fetchPolicy="cache-and-network" pollInterval={5000}>
          {({ loading, data }) => {
            return (
              <Card>
                <CardHeader style={{ position: 'relative' }}>
                  {/*relative because card-actions is absolute*/}
                  <i className="icon-menu" /> Timecards
                  <Button
                    className="card-actions mt-0 h-100"
                    color="primary"
                    onClick={() => {
                      window.open('https://endeavorfleet.com/download/timecards')
                      alert(
                        "The download should be starting. If it hasn't, verify that your popup blocker isn't preventing it from opening."
                      )
                    }}
                  >
                    <i className="fa fa-download fa-lg" />
                  </Button>
                </CardHeader>
                <CardBody className="p-0">
                  <ReactTable
                    style={{ backgroundColor: 'white', height: 'calc(100vh - 146px)' }}
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
    )
  }
}

export default Timecards
