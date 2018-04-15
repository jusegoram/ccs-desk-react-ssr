import React from 'react'
import autobind from 'autobind-decorator'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import { Card, CardHeader, CardBody, Button } from 'reactstrap'
import Moment from 'react-moment'
import alert from 'sweetalert'

import asNextJSPage from 'app/util/asNextJSPage'
import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'

export default asNextJSPage(
  class TechData extends React.Component {
    render() {
      const format = 'MMM Do, h:mm a'
      const columns = [
        {
          Header: 'Started At',
          accessor: 'createdAt',
          Cell: ({ original: { createdAt: time } }) => time && <Moment {...{ format }}>{time}</Moment>,
        },
        { Header: 'Status', accessor: 'status' },
        {
          Header: 'Provided By',
          accessor: 'dataSource.company.name',
        },
        {
          Header: 'Downloaded At',
          accessor: 'downloadedAt',
          Cell: ({ original: { downloadedAt: time } }) => time && <Moment {...{ format }}>{time}</Moment>,
        },
        {
          Header: 'Completed At',
          accessor: 'completedAt',
          Cell: ({ original: { completedAt: time } }) => time && <Moment {...{ format }}>{time}</Moment>,
        },
      ]
      return (
        <Layout>
          <Query {...data.DataImport.QUERY_recentTechImports} variables={{ limit: 10 }} fetchPolicy="cache-and-network">
            {({ loading, data }) => {
              return (
                <Card>
                  <CardHeader style={{ position: 'relative' }}>
                    {/*relative because card-actions is absolute*/}
                    <i className="icon-menu" /> Last 10 Tech Imports
                    <Button
                      className="card-actions mt-0 h-100"
                      color="primary"
                      onClick={() => {
                        window.open('https://endeavorfleet.com/download/timecards')
                        alert(
                          'The download should be starting.' +
                            " If it hasn't, verify that your popup blocker isn't preventing it from opening."
                        )
                      }}
                    >
                      <i className="fa fa-download fa-lg mr-1" /> Download Today&apos;s Data
                    </Button>
                  </CardHeader>
                  <CardBody className="p-0">
                    <ReactTable
                      ref={r => (this.checkboxTable = r)}
                      style={{ backgroundColor: 'white' }}
                      filterable
                      className="-striped -highlight"
                      loading={loading}
                      data={data && data.dataImports}
                      defaultPageSize={10}
                      showPaginationBottom={false}
                      defaultSorted={[{ id: 'age', desc: true }]}
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
