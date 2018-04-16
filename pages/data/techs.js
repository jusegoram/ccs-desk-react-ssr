import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import { Card, CardHeader, CardBody, Button, Badge } from 'reactstrap'
import Moment from 'react-moment'
import alert from 'sweetalert'
import moment from 'moment-timezone'

import asNextJSPage from 'app/util/asNextJSPage'
import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'
import cookie from 'cookie'

const statusColors = {
  Complete: 'success',
  Errored: 'danger',
  Pending: 'info',
  Downloading: 'info',
  Processing: 'info',
}

export default asNextJSPage(
  class TechData extends React.Component {
    state = { downloadUrl: null }
    render() {
      const { downloadUrl } = this.state
      const format = 'MMM Do, h:mm:ss a'
      const columns = [
        {
          Header: 'Started At',
          accessor: 'createdAt',
          Cell: ({ original: { createdAt: time } }) => time && <Moment {...{ format }}>{time}</Moment>,
        },
        {
          Header: 'Status',
          accessor: 'status',
          Cell: ({ original: { status } }) => <Badge color={statusColors[status]}>{status}</Badge>,
        },
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
          <Query
            {...data.DataImport.QUERY_recentTechImports}
            variables={{ limit: 10 }}
            fetchPolicy="cache-and-network"
            pollInterval={5000}
          >
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
                        const token = encodeURIComponent(cookie.parse(document.cookie).token)
                        const timezone = encodeURIComponent(moment.tz.guess())
                        const downloadUrl =
                          'https://local.endeavorfleet.com/download/techs' + `?token=${token}&timezone=${timezone}`
                        this.setState({ downloadUrl }, () => {
                          alert(
                            'The download should be starting.' +
                              " If it hasn't, verify that your popup blocker isn't preventing it from opening."
                          )
                        })
                      }}
                    >
                      <i className="fa fa-download fa-lg mr-1" /> Download Tech Data
                    </Button>
                  </CardHeader>
                  <CardBody className="p-0">
                    <ReactTable
                      style={{ backgroundColor: 'white' }}
                      className="-striped -highlight"
                      loading={(!data || !data.dataImports) && loading}
                      sortable={false}
                      data={data && data.dataImports}
                      defaultPageSize={10}
                      showPaginationBottom={false}
                      columns={columns}
                    />
                  </CardBody>
                  {downloadUrl && <iframe style={{ display: 'none' }} src={downloadUrl} />}
                </Card>
              )
            }}
          </Query>
        </Layout>
      )
    }
  }
)
