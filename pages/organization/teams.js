import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
// import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Button } from 'reactstrap'
// import alert from 'sweetalert'
import Link from 'next/link'

import data from 'app/apollo/data'
import axios from 'axios'

import Layout from 'app/ui/Layout'

export default class Teams extends React.Component {
  state = {
    activeWorkGroups: [],
    dmaEmail: '',
  };
  update = (name, e) => {
    this.setState({ [name]: e.target.value })
  };

  render() {
    const columns = [
      {
        Header: 'Team ID',
        accessor: 'externalId',
        Cell: ({ original }) => (
          <Link shallow href={`/organization/team/${original.id}`}>
            <a href="#">{original.externalId}</a>
          </Link>
        ),
      },
      { Header: 'Team Supervisor', accessor: 'name' },
    ]
    return (
      <Layout>
        <Query {...data.WorkGroup.QUERY} variables={{ order: 6}} fetchPolicy="cache-and-network">
          {({ loading, data }) => {
            return (
              <Card>
                <CardHeader style={{ position: 'relative' }}>
                  {/*relative because card-actions is absolute*/}
                  <i className="icon-menu" /> Teams
                </CardHeader>
                <CardBody className="p-0">
                  <ReactTable
                    style={{ backgroundColor: 'white', height: 'calc(100vh - 146px)' }}
                    filterable
                    className="-striped -highlight"
                    loading={!data.workGroups && loading}
                    data={data && data.workGroups}
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
