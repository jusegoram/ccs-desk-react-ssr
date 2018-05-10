//CCS_UNIQUE YXQM4TSPWUH
import React from 'react'
import { Button } from 'reactstrap'
import * as Icons from 'react-feather'
import alert from 'sweetalert'
import qs from 'qs'

import config from 'server/config'

class DownloadButton extends React.Component {
  render() {
    const { endpoint, children, params, ...props } = this.props
    const downloadUrl = config.host + `/download/${endpoint}?${qs.stringify(params || {})}`
    return (
      <Button
        {...props}
        download=""
        href={downloadUrl}
        onClick={() => {
          alert('Downloading', 'Your requested file should being downloading shortly', 'success')
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: '0 1 auto',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Icons.Download size={17} style={{ marginRight: '0.5rem' }} />
          {this.props.children}
        </div>
      </Button>
    )
  }
}

export default DownloadButton
