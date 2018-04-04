import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Button } from 'reactstrap'
import alert from 'sweetalert'

import withApolloProvider from 'app/apollo/withApolloProvider'
import data from 'app/apollo/data'

import Page from 'app/ui/Page'
import Layout from 'app/ui/Layout'

class Accounts extends React.Component {
  render() {
    const columns = [
      { Header: 'Name', accessor: 'name' },
      { Header: 'Company', accessor: 'company.name' },
      { Header: 'Role', accessor: 'role' },
      {
        Header: 'Mimic',
        id: 'mimic',
        Cell: ({ row }) => <Button>Mimic</Button>,
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
      <Page title="Dashboard" location={this.props.url}>
        <Layout>
          <Query {...data.Account.QUERY} fetchPolicy="cache-and-network" pollInterval={5000}>
            {({ loading, data }) => {
              return (
                <Card>
                  <CardHeader style={{ position: 'relative' }}>
                    {/*relative because card-actions is absolute*/}
                    <i className="icon-menu" /> Accounts
                  </CardHeader>
                  <CardBody className="p-0">
                    <ReactTable
                      style={{ backgroundColor: 'white', height: 'calc(100vh - 146px)' }}
                      filterable
                      className="-striped -highlight"
                      loading={!data.accounts && loading}
                      data={data && data.accounts}
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

export default withApolloProvider(Accounts)
