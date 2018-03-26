import React from 'react'
import PropTypes from 'prop-types'

export default Component =>
  class WithSession extends React.Component {
    static displayName = `WithSession(${Component.displayName || Component.name || 'Unknown'})`
    static contextTypes = {
      session: PropTypes.object,
    }

    render() {
      const { props, context } = this
      return <Component {...props} session={context.session} />
    }
  }
