import React from 'react'
import PropTypes from 'prop-types'

export default class SessionProvider extends React.Component {
  static childContextTypes = {
    session: PropTypes.object,
  }

  getChildContext() {
    return { session: this.props.session }
  }

  render() {
    return this.props.children
  }
}
