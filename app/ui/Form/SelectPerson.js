import React, { Component } from 'react'
import { find } from 'lodash'
import Select from 'react-select'

export default class ManagerPermissions extends Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      personId: null,
    }
  }
  render() {
    const { onChange, persons, props } = this.props
    return (
      <Select
        name="person"
        placeholder="John Smith"
        matchProp="label"
        openOnFocus
        value={this.state.personId}
        options={persons.map(person => ({
          value: person.id,
          label: person.name,
        }))}
        onChange={selection => {
          this.setState({ personId: selection.value })
          onChange(find(persons, { id: selection.value }))
        }}
        {...props}
      />
    )
  }
}
