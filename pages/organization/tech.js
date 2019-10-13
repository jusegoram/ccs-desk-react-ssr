import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
// import moment from 'moment-timezone'
import { Row, Col, Card, CardHeader, CardBody, Table } from 'reactstrap'
// import alert from 'sweetalert'
// import Link from 'next/link'
import _ from 'lodash'

import ApolloData from 'app/apollo/data'

import Layout from 'app/ui/Layout'

export default class Employee extends React.Component {
  render() {
    const { employeeId } = this.props.location.query
    return (
      <Layout>
        <Query {...ApolloData.Employee.GET} variables={{ id: employeeId }} fetchPolicy="cache-and-network">
          {({ loading, data }) => {
            if (loading || !data)
              return (
                <Row>
                  <Col>Loading...</Col>
                </Row>
              )
            const { tech } = data
            const workGroupIds = tech && _.map(tech.workGroups || [], 'id')
            return (
              <div>
                <Row>
                  <Col>
                    <h2>{tech.name}</h2>
                  </Col>
                  <Col style={{ textAlign: 'end' }}>
                    {/* <Button size="sm" color="primary">
                        Log Call
                      </Button> */}
                  </Col>
                </Row>
                <Row>
                  <Col xs="12" md="4">
                    <Card>
                      <CardHeader>Basic Info</CardHeader>
                      <CardBody className="p-0">
                        <Table className="m-0" striped>
                          <tbody>
                            <tr>
                              <th>Employee ID</th>
                              <td>{tech.externalId}</td>
                            </tr>
                            <tr>
                              <th>Phone Number</th>
                              <td>{tech.phoneNumber}</td>
                            </tr>
                            <tr>
                              <th>Email</th>
                              <td>{tech.email}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col xs="12" md="4">
                    <Card>
                      <CardHeader>Other Info</CardHeader>
                      <CardBody className="p-0">
                        <Table className="m-0" striped>
                          <tbody>
                            <tr>
                              <th>Schedule</th>
                              <td>{tech.schedule}</td>
                            </tr>
                            <tr>
                              <th>Skills</th>
                              <td>{tech.skills}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col xs="12" md="4">
                    {/* <Card>
                        <CardHeader>Start Location</CardHeader>
                        <CardBody className="p-0">[map goes here]</CardBody>
                      </Card> */}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Query {...ApolloData.WorkGroup.QUERY_idIn} variables={{ ids: workGroupIds }}>
                      {({ loading, data }) => {
                        if (loading || !data || !data.workGroups)
                          return (
                            <Row>
                              <Col>Loading...</Col>
                            </Row>
                          )
                        const workGroups = _.flatten(
                          _.map(data.workGroups, workGroup =>
                            (workGroup.managers.length ? workGroup.managers : [{}]).map(manager => ({
                              workGroup,
                              manager,
                            }))
                          )
                        )
                        const columns = [
                          { Header: 'Type', accessor: 'workGroup.type' },
                          { Header: 'Name', accessor: 'workGroup.name' },
                          { Header: 'Manager', accessor: 'manager.name' },
                          { Header: 'Manager Phone', accessor: 'manager.phoneNumber' },
                          { Header: 'Manager Email', accessor: 'manager.email' },
                        ]
                        return (
                          <Card>
                            <CardHeader style={{ position: 'relative' }}>
                              {/*relative because card-actions is absolute*/}
                              <i className="icon-menu" /> Work Groups
                            </CardHeader>
                            <CardBody className="p-0">
                              <ReactTable
                                style={{ backgroundColor: 'white' }}
                                filterable
                                className="-striped -highlight"
                                loading={!data.workGroups && loading}
                                data={workGroups}
                                showPaginationBottom={false}
                                defaultPageSize={7}
                                pageSize={data && data.workGroups && data.workGroups.length}
                                columns={columns}
                                defaultFilterMethod={(filter, row) =>
                                  String(row[filter.id])
                                  .toLowerCase()
                                  .indexOf(String(filter.value).toLowerCase()) !== -1
                                }
                              />
                            </CardBody>
                          </Card>
                        )
                      }}
                    </Query>
                  </Col>
                </Row>
              </div>
            )
          }}
        </Query>
      </Layout>
    )
  }
}
