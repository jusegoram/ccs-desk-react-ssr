//CCS_UNIQUE YXQM4TSPWUH
import React from 'react'
import { Button } from 'reactstrap'
import moment from 'moment-timezone'
import * as Icons from 'react-feather'
import alert from 'sweetalert'
import cookie from 'cookie'

import config from 'server/config'

class DownloadButton extends React.Component {
  state = {
    downloadUrl: null,
  }
  render() {
    const { downloadUrl } = this.state
    const { endpoint, children, ...props } = this.props
    return (
      <Button
        {...props}
        onClick={() => {
          const token = encodeURIComponent(cookie.parse(document.cookie).token)
          const timezone = encodeURIComponent(moment.tz.guess())
          const downloadUrl = config.host + `/download/${endpoint}?token=${token}&timezone=${timezone}`
          this.setState({ downloadUrl }, () => {
            alert(
              'The download should be starting.' +
                " If it hasn't, verify that your popup blocker isn't preventing it from opening."
            )
          })
        }}
      >
        {downloadUrl && <iframe style={{ display: 'none' }} src={downloadUrl} />}
        <Icons.Download size={17} style={{ verticalAlign: '-15%' }} /> {this.props.children}
      </Button>
    )
  }
}

export default DownloadButton
