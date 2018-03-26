import React from 'react'
import PropTypes from 'prop-types'

export default Component =>
  class withLocation extends React.Component {
    static displayName = `WithSession(${Component.displayName || Component.name || 'Unknown'})`
    static contextTypes = {
      location: PropTypes.object,
    }

    render() {
      const { props, context } = this
      return <Component {...props} location={context.location} />
    }
  }
