//CCS_UNIQUE WLJ95V5NC1J
import React from 'react'
import { Form, FormGroup, Label, Input, Button, FormFeedback } from 'reactstrap'

const required = value => (value ? undefined : 'Required')
const renderField = ({ input, label, children, type, meta: { touched, error } }) => {
  let color = 'normal'
  if (touched && error) {
    color = 'danger'
  }
  return (
    <FormGroup color={color}>
      <Label>{label}</Label>
      <div>
        <Input {...input} placeholder={label} type={type}>
          {children}
        </Input>
        {touched && (error && <FormFeedback>{error}</FormFeedback>)}
      </div>
    </FormGroup>
  )
}

const InviteForm = () => {
  return (
    <div
      style={{
        height: '100%',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 20,
      }}
    >
      <Form name="invite">
        <FormGroup>
          <Label>Company</Label>
          <div>
            <Input value="TODO" readOnly />
          </div>
        </FormGroup>
        <Input name="name" component={renderField} type="text" label="First Name" validate={required} />
        <Input name="email" component={renderField} type="email" label="Email" validate={required} />
        <Input name="role" component={renderField} type="select" label="Role">
          <option />
          <option value="Supervisor">Supervisor</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
        </Input>
        <Button color="primary" type="submit">
          Send Invite
        </Button>
      </Form>
    </div>
  )
}

export default InviteForm
