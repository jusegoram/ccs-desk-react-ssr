import React from 'react'

const exposedEnvProps = ['HOST', 'DEV_NETWORK_LATENCY']

export default Component => {
  if (!Component.getInitialProps) Component.getInitialProps = () => ({})
  const childName = Component.displayName || Component.name || 'Unknown'
  class WithEnvVars extends React.Component {
    static displayName = `WithEnvVars(${childName})`

    // https://github.com/zeit/next.js/#fetching-data-and-component-lifecycle
    static async getInitialProps(ctx) {
      let initialProps = (await Component.getInitialProps(ctx)) || {}

      if (process.browser) return initialProps

      const exposedEnvVars = {}
      exposedEnvProps.forEach(prop => (exposedEnvVars[prop] = process.env[prop]))

      return {
        exposedEnvVars,
        ...initialProps,
      }
    }

    constructor(props) {
      super(props)
      for (var prop in this.props.exposedEnvVars) process.env[prop] = this.props.exposedEnvVars[prop]
    }
    render() {
      const { exposedEnvVars, ...props } = this.props
      return <Component {...props} />
    }
  }
  return WithEnvVars
}
