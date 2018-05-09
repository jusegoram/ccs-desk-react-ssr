import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import { Card, CardHeader, CardBody, Button, Badge } from 'reactstrap'
import Moment from 'react-moment'
import alert from 'sweetalert'
import cookie from 'cookie'
import moment from 'moment-timezone'

import data from 'app/apollo/data'

import DownloadButton from 'app/ui/widgets/DownloadButton'
import Layout from 'app/ui/Layout'
import config from 'server/config'
import CreateInvite from 'app/ui/Form/CreateInvite'

export default class CreateInvitePage extends React.Component {
  render() {
    return (
      <Layout>
        <CreateInvite
          onSendInvite={() => {
            alert(
              'Invite Sent',
              'The specified recipient will soon receive an email inviting them to the service',
              'success'
            )
          }}
        />
      </Layout>
    )
  }
}
