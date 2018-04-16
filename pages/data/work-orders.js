import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import { Card, CardHeader, CardBody, Button, Badge } from 'reactstrap'
import Moment from 'react-moment'
import alert from 'sweetalert'
import cookie from 'cookie'
import moment from 'moment-timezone'

import asNextJSPage from 'app/util/asNextJSPage'
import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'
import config from 'server/config'

const statusColors = {
  Complete: 'success',
  Errored: 'danger',
  Aborted: 'danger',
  Pending: 'info',
  Downloading: 'info',
  Processing: 'info',
}

export default asNextJSPage(
  class WorkOrderData extends React.Component {
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
          Header: 'Report',
          accessor: 'reportName',
        },
        {
          Header: 'Source',
          accessor: 'dataSource.name',
        },
        {
          Header: 'Company',
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
            {...data.DataImport.QUERY_todaysWorkOrderImports}
            variables={{
              createdAtGte: moment()
              .startOf('day')
              .format(),
              createdAtLt: moment()
              .endOf('day')
              .format(),
            }}
            fetchPolicy="cache-and-network"
            pollInterval={5000}
          >
            {({ loading, data }) => {
              return (
                <Card>
                  <CardHeader style={{ position: 'relative' }}>
                    {/*relative because card-actions is absolute*/}
                    <i className="icon-menu" /> Last 10 Work Order Imports
                    <Button
                      className="card-actions mt-0 h-100"
                      color="primary"
                      onClick={() => {
                        const token = encodeURIComponent(cookie.parse(document.cookie).token)
                        const timezone = encodeURIComponent(moment.tz.guess())
                        const downloadUrl =
                          config.host + '/download/work-orders' + `?token=${token}&timezone=${timezone}`
                        this.setState({ downloadUrl }, () => {
                          alert(
                            'The download should be starting.' +
                              " If it hasn't, verify that your popup blocker isn't preventing it from opening."
                          )
                        })
                      }}
                    >
                      <i className="fa fa-download fa-lg mr-1" /> Download Work Order Data
                    </Button>
                  </CardHeader>
                  <CardBody className="p-0">
                    <ReactTable
                      style={{ backgroundColor: 'white', height: 'calc(100vh - 146px)' }}
                      className="-striped -highlight"
                      loading={(!data || !data.dataImports) && loading}
                      sortable={false}
                      data={data && data.dataImports}
                      defaultPageSize={15}
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
