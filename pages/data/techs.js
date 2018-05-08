import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import { Card, CardHeader, CardBody, Badge } from 'reactstrap'
import Moment from 'react-moment'
import moment from 'moment-timezone'

import asNextJSPage from 'app/util/asNextJSPage'
import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'
import DownloadButton from 'app/ui/widgets/DownloadButton'

const statusColors = {
  Complete: 'success',
  Errored: 'danger',
  Aborted: 'danger',
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
            {...data.DataImport.QUERY_todaysTechImports}
            variables={{
              createdAtGte: moment()
              .startOf('day')
              .format(),
              createdAtLt: moment()
              .endOf('day')
              .format(),
            }}
            fetchPolicy="cache-and-network"
            pollInterval={15000}
          >
            {({ loading, data }) => {
              return (
                <Card>
                  <CardHeader style={{ position: 'relative' }}>
                    {/*relative because card-actions is absolute*/}
                    <i className="icon-menu" /> Today&apos;s Tech Data Imports
                    <DownloadButton endpoint="techs" className="card-actions mt-0 h-100" color="primary">
                      Download Tech Data
                    </DownloadButton>
                  </CardHeader>
                  <CardBody className="p-0">
                    <ReactTable
                      style={{ backgroundColor: 'white', height: 'calc(100vh - 146px)' }}
                      className="-striped -highlight"
                      loading={(!data || !data.dataImports) && loading}
                      filterable={true}
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
