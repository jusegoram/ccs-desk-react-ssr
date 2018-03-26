import React, { Component } from 'react'
import _ from 'lodash'

class Form extends Component {
  constructor(props) {
    super(props)
    this.onSubmit = this.onSubmit.bind(this)
    this.submitCallback = props.onEverySubmit || _.once(props.onSubmit)
  }
  onSubmit(event) {
    event.preventDefault()
    event.stopPropagation()
    const fields = {}
    const data = new FormData(event.target) // eslint-disable-line no-undef
    for (var [key, val] of data) fields[key] = val
    this.submitCallback(fields)
  }
  render() {
    return <form onSubmit={this.onSubmit}>{this.props.children}</form>
  }
}

export default Form
