import React from 'react'
import ReactTable from 'react-table'
import { Query, Mutation } from 'react-apollo'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Button } from 'reactstrap'
import alert from 'sweetalert'

import asNextJSPage from 'app/util/asNextJSPage'
import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'

class Accounts extends React.Component {
  render() {
    return (
      <Layout>
        <Mutation {...data.Session.M_mimic}>
          {mimic => {
            const columns = [
              { Header: 'Name', accessor: 'name' },
              { Header: 'Company', accessor: 'company.name' },
              { Header: 'Role', accessor: 'role' },
              {
                Header: 'Action',
                id: 'action',
                filterable: false,
                Cell: ({ row }) => (
                  <Button
                    size="sm"
                    onPress={() => {
                      mimic({ variables: { accountId: row.id } })
                    }}
                  >
                    Mimic
                  </Button>
                ),
              },
            ]
            return (
              <Query {...data.Account.QUERY} fetchPolicy="network-only">
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
            )
          }}
        </Mutation>
      </Layout>
    )
  }
}

export default asNextJSPage(Accounts)
