//CCS_UNIQUE YXQM4TSPWUH
import React from 'react'
import { ButtonGroup, Button } from 'reactstrap'
import _ from 'lodash'

class Toggle extends React.Component {
  render() {
    const { options, onChange, selected } = this.props
    return (
      <ButtonGroup style={{ margin: 3 }}>
        {options.map(option => {
          const { name, value, disabled } = option
          return (
            <Button
              key={value}
              color="success"
              active={option.value === selected}
              onClick={() => {
                onChange && onChange(option.value)
              }}
              disabled={disabled}
            >
              {name}
            </Button>
          )
        })}
      </ButtonGroup>
    )
  }
}

export default Toggle
