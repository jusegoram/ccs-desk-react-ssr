import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Button } from 'reactstrap'
import alert from 'sweetalert'
import Link from 'next/link'

import asNextJSPage from 'app/util/asNextJSPage'
import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'

export default asNextJSPage(
  class Employees extends React.Component {
    render() {
      const columns = [
        {
          Header: 'Employee ID',
          accessor: 'externalId',
          Cell: ({ original }) => (
            <Link shallow href={`/tech/${original.id}`}>
              <a href="#">{original.externalId}</a>
            </Link>
          ),
        },
        { Header: 'Employee', accessor: 'name' },
        { Header: 'Phone', accessor: 'phoneNumber' },
        {
          Header: 'Company',
          accessor: 'company.name',
        },
      ]
      return (
        <Layout>
          <Query {...data.Employee.QUERY_techs} fetchPolicy="cache-and-network">
            {({ loading, data }) => {
              return (
                <Card>
                  <CardHeader style={{ position: 'relative' }}>
                    {/*relative because card-actions is absolute*/}
                    <i className="icon-menu" /> Techs
                    {/* <Button
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
                    </Button> */}
                  </CardHeader>
                  <CardBody className="p-0">
                    <ReactTable
                      style={{ backgroundColor: 'white', height: 'calc(100vh - 146px)' }}
                      filterable
                      className="-striped -highlight"
                      loading={!data.employees && loading}
                      data={data && data.employees}
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
)
