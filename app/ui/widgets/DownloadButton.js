//CCS_UNIQUE YXQM4TSPWUH
import React from 'react'
import { Button } from 'reactstrap'
import moment from 'moment-timezone'
import * as Icons from 'react-feather'
import alert from 'sweetalert'
import cookie from 'cookie'

import config from 'server/config'

class DownloadButton extends React.Component {
  render() {
    const { endpoint, children, ...props } = this.props
    const token = encodeURIComponent(cookie.parse(document.cookie).token)
    const timezone = encodeURIComponent(moment.tz.guess())
    const downloadUrl = config.host + `/download/${endpoint}?token=${token}&timezone=${timezone}`
    return (
      <Button
        {...props}
        download=""
        href={downloadUrl}
        onClick={() => {
          alert(
            'The download should be starting.' +
              " If it hasn't, verify that your popup blocker isn't preventing it from opening."
          )
        }}
      >
        <Icons.Download size={17} style={{ verticalAlign: '-15%' }} /> {this.props.children}
      </Button>
    )
  }
}

export default DownloadButton
