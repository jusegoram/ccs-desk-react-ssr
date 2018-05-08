import React from 'react'

import ApolloFactory from 'app/apollo/ApolloFactory'
import Promise from 'bluebird'
import axios from 'axios'

class SubBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = { value: 0 }
    this.inc = this.inc.bind(this)
  }
  componentDidMount() {
    this.interval = setInterval(this.inc, 100)
    this.props.promise.then(() => {
      clearInterval(this.interval)
      if (!this.unmounted) this.setState({ value: 100 })
    })
  }
  componentWillUnmount() {
    this.unmounted = true
    clearInterval(this.interval)
  }
  render() {
    const classes = 'progress-bar bg-info progress-bar-animated'
    return <div className={classes} role="progressbar" style={{ width: this.props.scale * this.state.value + 'vw' }} />
  }
  inc() {
    if (this.state.value >= 100) return

    var rnd = 0

    var stat = this.state.value / 100
    if (stat >= 0 && stat < 0.25) {
      // Start out between 3 - 6% increments
      rnd = (Math.random() * (5 - 3 + 1) + 3) / 100
    } else if (stat >= 0.25 && stat < 0.65) {
      // increment between 0 - 3%
      rnd = Math.random() * 3 / 100
    } else if (stat >= 0.65 && stat < 0.9) {
      // increment between 0 - 2%
      rnd = Math.random() * 2 / 100
    } else if (stat >= 0.9 && stat < 0.99) {
      // finally, increment it .5 %
      rnd = 0.005
    } else {
      // after 99%, don't increment:
      rnd = 0
    }

    var pct = this.state.value + rnd * 100
    this.setState({ value: pct })
  }
}

class NetworkProgressBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = { requests: [] }
    this.onRequest = this.onRequest.bind(this)
    this.requestId = 0
    this.numActiveRequests = 0
    this.axiosInterceptor = config => {
      const request = new Promise(resolve => {
        config.transformResponse = config.transformResponse.concat([data => {
          resolve()
          return data
        }
      }])
      .timeout(10000)
      .catch(() => {})
      this.onRequest(request)
      return config
    }
  }
  onRequest(request) {
    this.numActiveRequests++
    const requestId = this.requestId++
    if (this.ismounted && !this.isunmounted)
      this.setState({ requests: [...this.state.requests, { promise: request, key: requestId }] })
    Promise.resolve(request).tap(() => {
      this.numActiveRequests--
      if (this.numActiveRequests === 0) if (this.ismounted && !this.isunmounted) this.setState({ requests: [] })
    })
  }

  componentDidMount() {
    this.ismounted = true
    ApolloFactory.getInstance().addRequestListener(this.onRequest)
    axios.interceptors.request.use(this.axiosInterceptor)
  }
  componentWillUnmount() {
    this.isunmounted = true
    ApolloFactory.getInstance().removeRequestListener(this.onRequest)
    axios.interceptors.request.eject(this.axiosInterceptor)
  }
  render() {
    const style = {
      position: 'fixed',
      backgroundColor: 'transparent',
      opacity: this.state.requests.length ? 1 : 0,
      transition: 'opacity 300ms',
      zIndex: 10000,
    }
    const scale = this.state.requests.length ? 1 / this.state.requests.length : 1
    return (
      <div className="progress progress-xs" style={style}>
        {this.state.requests.map(request => <SubBar {...request} scale={scale} />)}
      </div>
    )
  }
}

export default NetworkProgressBar
