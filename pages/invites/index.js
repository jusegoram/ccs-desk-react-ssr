import React from 'react'

import MainApp from 'app/ui/MainApp'
import ReactTable from 'react-table'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'
import Link from 'next/link'
import _ from 'lodash'

class Index extends React.Component {
  constructor(props) {
    super(props)
    this.state = { limit: 20, offset: 0 }
  }
  render() {
    const columns = [
      { Header: 'Recipient', accessor: 'recipient.owner.name' },
      { Header: 'Email', accessor: 'recipient.email' },
      { Header: 'Status', accessor: 'status' },
    ]
    return (
      <MainApp location={this.props.location}>
        <Query query={INVITES} fetchPolicy="network-only">
          {({ loading, error, data }) => {
            return (
              <ReactTable
                style={{ backgroundColor: 'white', height: 'calc(100vh - 100px)' }}
                filterable
                className="-striped -highlight"
                loading={loading}
                data={data && data.invites}
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
      </MainApp>
    )
  }
}

const INVITES = gql`
  query invites {
    invites {
      id
      status
      recipient {
        id
        email
        owner {
          id
          name
        }
      }
    }
  }
`

export default Index
