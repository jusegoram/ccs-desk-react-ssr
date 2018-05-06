//CCS_UNIQUE YXQM4TSPWUH
import React from 'react'
import PropTypes from 'prop-types'
import { Form, FormGroup, Label, Input } from 'reactstrap'
import moment from 'moment-timezone'

class DateRangePicker extends React.Component {
  constructor(props) {
    super(props)
    this.state = props.defaultRange || {
      start: moment().format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
    }
    this.onChange = this.onChange.bind(this)
  }

  onChange(boundName) {
    return e => {
      if (!e.target.value || !moment(e.target.value, 'YYYY-MM-DD').isValid()) return
      this.setState({ [boundName]: e.target.value }, () => {
        this.props.onChange(this.state)
      })
    }
  }

  render() {
    const { start, end } = this.state
    return (
      <Form inline>
        <FormGroup>
          <Input
            type="date"
            placeholder="date placeholder"
            value={start}
            onChange={this.onChange('start')}
            style={{ width: 170 }}
          />
          <Input
            type="date"
            placeholder="date placeholder"
            value={end}
            onChange={this.onChange('end')}
            style={{ width: 170 }}
          />
        </FormGroup>
      </Form>
    )
  }
}

DateRangePicker.propTypes = {
  defaultRange: PropTypes.object,
  onChange: PropTypes.func.isRequired,
}

export default DateRangePicker
