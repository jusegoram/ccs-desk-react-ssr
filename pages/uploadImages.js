import React from 'react'

import { Col, Container, Row } from 'reactstrap'
import { withLocation } from 'app/util/providers'

class UploadImages extends React.Component {
  render() {
    return (
      <div>
        <h3>{this.props.url.query.token}</h3>
        <input type="file" accept="image/*" capture="camera" />
        Close the page when you're done because if we do it automatically, it doesn't always resolve the promise
      </div>
    )
  }
}

export default withLocation(UploadImages)
