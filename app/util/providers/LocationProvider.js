import React from 'react'
import PropTypes from 'prop-types'

export default class LocationProvider extends React.Component {
  static childContextTypes = {
    location: PropTypes.object,
  }

  getChildContext() {
    return { location: this.props.location }
  }

  render() {
    return this.props.children
  }
}
