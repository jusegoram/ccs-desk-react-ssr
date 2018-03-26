import React, { Component } from 'react'
import {
  Row,
  Col,
  CardGroup,
  CardHeader,
  CardFooter,
  Card,
  CardBody,
  Button,
  Input,
  InputGroup,
  Table,
} from 'reactstrap'
import Form from 'app/ui/Form'
import Link from 'next/link'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import { get as p, pickBy, find } from 'lodash'
import Select from 'react-select'
import SelectPerson from 'app/ui/Form/SelectPerson'

const QUERY = gql`
  query q {
    companys {
      id
      name
    }
    offices {
      id
      name
    }
    teams {
      id
      name
    }
    persons {
      id
      name
    }
    session {
      id
      account {
        id
        person {
          id
          role {
            id
            creatableRoles
            companyId
            officeId
            teamId
          }
        }
      }
    }
  }
`

export default class ManagePermissions extends Component {
  constructor(props) {
    super(props)
    this.state = {
      person: null,
      role: null,
    }
  }
  addPermission() {
    this.setState({ permissions: [...this.state.permissions, {}] })
  }
  deletePermission(index) {
    const permissions = this.state.permissions.slice(0)
    permissions.splice(index, 1)
    this.setState({ permissions })
  }
  sendInvite() {
    this.props.onSendInvite({
      person: this.state.recipient,
      recipientName: this.state.recipientName,
      permissions: this.state.permissions.map(permission =>
        pickBy({
          companyId: p(permission, 'company.id'),
          officeId: p(permission, 'office.id'),
          teamId: p(permission, 'team.id'),
        })
      ),
    })
  }
  render() {
    return (
      <Query query={QUERY}>
        {({ loading, data }) => {
          if (loading)
            return (
              <Card>
                <CardBody>Loading...</CardBody>
              </Card>
            )
          const role = data.session.account.person.role
          return (
            <Form onSubmit={this.sendInvite.bind(this)}>
              <Card>
                <CardHeader>Select User</CardHeader>
                <CardBody>
                  <SelectPerson
                    required
                    persons={data.persons}
                    onChange={person => {
                      this.setState({ person })
                    }}
                  />
                </CardBody>
              </Card>
              {this.state.person && (
                <Card>
                  <CardHeader>Role</CardHeader>
                  <CardBody>
                    <Select
                      placeholder="Role"
                      name="role"
                      required
                      openOnFocus
                      matchProp="label"
                      value={p(this.state, 'role.name')}
                      options={role.creatableRoles.map(role => ({
                        value: role,
                        label: role,
                      }))}
                      onChange={role => {
                        this.setState({ role: { name: role.value } })
                      }}
                    />
                    {p(this.state, 'role.name') === 'Manager' && (
                      <Select
                        placeholder="Select Managed Office"
                        name="office"
                        className="mt-3"
                        openOnFocus
                        matchProp="label"
                        value={this.state.role.officeId}
                        options={data.offices.map(office => ({
                          value: office.id,
                          label: office.name,
                        }))}
                        onChange={selection => {
                          this.setState({
                            role: {
                              ...this.state.role,
                              officeId: selection.value,
                            },
                          })
                        }}
                      />
                    )}
                    {p(this.state, 'role.name') === 'Supervisor' && (
                      <Select
                        placeholder="Select Supervised Team"
                        name="team"
                        className="mt-3"
                        openOnFocus
                        matchProp="label"
                        value={this.state.role.teamId}
                        options={data.teams.map(team => ({
                          value: team.id,
                          label: team.name,
                        }))}
                        onChange={selection => {
                          this.setState({
                            role: {
                              ...this.state.role,
                              teamId: selection.value,
                            },
                          })
                        }}
                      />
                    )}
                  </CardBody>
                </Card>
              )}
              {/* 
              <Card>
                <CardHeader>Permissions</CardHeader>
                <CardBody>
                  {!this.state.permissions.length && (
                    <div>Click &quot;Add Permissions&quot; below to provide this user with access</div>
                  )}
                  {!!this.state.permissions.length && (
                    <Table bordered hover className="mb-0">
                      <thead>
                        <tr>
                          <td>Company</td>
                          <td>Office</td>
                          <td>Team</td>
                          <td>Action</td>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.permissions.map((permission, index) => {
                          return (
                            <tr key={index}>
                              <td>
                                <Input
                                  type="select"
                                  name="company"
                                  bsSize="sm"
                                  onChange={e => {
                                    const newPermissions = this.state.permissions.slice(0)
                                    newPermissions[index] = {
                                      ...this.state.permissions[index],
                                      company: JSON.parse(e.target.value),
                                      office: null,
                                      team: null,
                                    }
                                    this.setState({ permissions: newPermissions })
                                  }}
                                >
                                  {!permission.company && <option value={null}>Select One</option>}
                                  {data.companys.map(company => (
                                    <option key={company.id} value={JSON.stringify(company)}>
                                      {company.name}
                                    </option>
                                  ))}
                                </Input>
                              </td>
                              <td>
                                {!permission.company ? (
                                  '(any)'
                                ) : (
                                  <Input
                                    type="select"
                                    name="office"
                                    bsSize="sm"
                                    onChange={e => {
                                      const newPermissions = this.state.permissions.slice(0)
                                      newPermissions[index] = {
                                        ...this.state.permissions[index],
                                        office: JSON.parse(e.target.value),
                                        team: null,
                                      }
                                      console.log(newPermissions)
                                      this.setState({ permissions: newPermissions })
                                    }}
                                  >
                                    <option value={'null'}>(any)</option>
                                    {data.offices.map(office => (
                                      <option key={office.id} value={JSON.stringify(office)}>
                                        {office.name}
                                      </option>
                                    ))}
                                  </Input>
                                )}
                              </td>
                              <td>
                                {!permission.company || !permission.office ? (
                                  '(any)'
                                ) : (
                                  <Input
                                    type="select"
                                    name="team"
                                    bsSize="sm"
                                    onChange={e => {
                                      const newPermissions = this.state.permissions.slice(0)
                                      newPermissions[index] = {
                                        ...this.state.permissions[index],
                                        team: JSON.parse(e.target.value),
                                      }
                                      this.setState({ permissions: newPermissions })
                                    }}
                                  >
                                    <option value={'null'}>(any)</option>
                                    {data.teams.map(team => (
                                      <option key={team.id} value={JSON.stringify(team)}>
                                        {team.name}
                                      </option>
                                    ))}
                                  </Input>
                                )}
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  color="danger"
                                  onClick={() => {
                                    this.deletePermission(index)
                                  }}
                                >
                                  <i className="icon-minus" /> Delete
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
                <CardFooter>
                  <Button color="info" onClick={this.addPermission.bind(this)}>
                    Add Permission
                  </Button>
                </CardFooter>
              </Card> */}
            </Form>
          )
        }}
      </Query>
    )
  }
}
