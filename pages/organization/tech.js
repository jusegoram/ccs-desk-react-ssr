import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import axios from 'axios'

// import moment from 'moment-timezone'
import { Row, Col, Card, CardHeader, CardBody, Table } from 'reactstrap'
// import alert from 'sweetalert'
// import Link from 'next/link'
import _ from 'lodash'

import ApolloData from 'app/apollo/data'

import Layout from 'app/ui/Layout'
import moment from 'moment'

function FindDma(props){
  const {dmas, dma} = props.variables
  if(dma) {
    const filtered = dmas.filter(item => item.dma.toLowerCase().includes(dma.toLowerCase()))
    console.log('filtered', filtered)
    if(filtered.length === 1) {
      return (
        <div>
            <CardHeader>DMA: {filtered[0].dma.toUpperCase()} </CardHeader>
            <Table className="m-0" striped>
              <tbody>
              <tr>
                <th>Man. Name</th>
                <td>{filtered[0].managerName}</td>
              </tr>
              <tr>
                <th>Man. Email</th>
                <td>{filtered[0].email}</td>
              </tr>
              <tr>
                <th>Man. Phone</th>
                <td>{filtered[0].managerPhone}</td>
              </tr>
            </tbody>
            </Table>
        </div>
      )
    }
    return null
}
return null
}

function OnTempTeamClaim(props) {
  const {row, tech, dmas } = props.variables
  if(moment(tech.tempClaimToDate).isAfter(moment())){
    return(
      <Col xs="12" md="4">
        <Card>
          <CardHeader>TEMP CLAIM - Team ID: {tech.tempClaimTeamId}</CardHeader>
          <CardBody className="p-0">
            <Table className="m-0" striped>
              <tbody>
                <tr>
                  <th>Team Name</th>
                  <td>{tech.tempClaimTeamName}</td>
                </tr>
                <tr>
                  <th>Team Email</th>
                  <td>{tech.tempClaimTeamEmail}</td>
                </tr>
                <tr>
                  <th>Team Phone</th>
                  <td>{tech.tempClaimTeamPhone}</td>
                </tr>
              </tbody>
            </Table>

            <FindDma variables={{dma:row['DMA'], dmas:dmas}}></FindDma>

          </CardBody>

        </Card>
      </Col>
    )
  }else{
    return(
      <Col xs="12" md="4">
        <Card>
          <CardHeader>Team ID: {row['Team ID']}</CardHeader>
          <CardBody className="p-0">
            <Table className="m-0" striped>
              <tbody>
                <tr>
                  <th>Team Name</th>
                  <td>{row['Team Name']}</td>
                </tr>
                <tr>
                  <th>Team Email</th>
                  <td>{row['Team Email']}</td>
                </tr>
                <tr>
                  <th>Team Phone</th>
                  <td>{row['Tech Team Supervisor Mobile #']}</td>
                </tr>
              </tbody>
            </Table>
            <FindDma variables={{dma:row['DMA'], dmas:dmas}}></FindDma>
          </CardBody>
        </Card>
      </Col>)
  }

}

export default class Employee extends React.Component {
  state = {
    row: '',
    dma: [
      {
        dma: 'Champaign IL',
        email: 'msiebers@goodmannetworks.com',
        managerName: 'Mike Siebers',
        managerPhone: '',
      },
      {
        dma: 'Davenport IA',
        email: 'msiebers@goodmannetworks.com',
        managerName: 'Mike Siebers',
        managerPhone: '',
      },
      {
        dma: 'Evansville IN',
        email: 'msiebers@goodmannetworks.com',
        managerName: 'Mike Siebers',
        managerPhone: '',
      },
      {
        dma: 'Indianapolis IN',
        email: 'msiebers@goodmannetworks.com',
        managerName: 'Mike Siebers',
        managerPhone: '',
      },
      {
        dma: 'Lafayette IN',
        email: 'msiebers@goodmannetworks.com',
        managerName: 'Mike Siebers',
        managerPhone: '',
      },
      {
        dma: 'Peoria IL',
        email: 'msiebers@goodmannetworks.com',
        managerName: 'Mike Siebers',
        managerPhone: '',
      },
      {
        dma: 'Cincinnati OH',
        email: 'dkingery@goodmannetworks.com',
        managerName: 'Dave Kingery',
        managerPhone: '',
      },
      {
        dma: 'Lexington KY',
        email: 'dkingery@goodmannetworks.com',
        managerName: 'Dave Kingery',
        managerPhone: '',
      },
      {
        dma: 'Louisville KY',
        email: 'dkingery@goodmannetworks.com',
        managerName: 'Dave Kingery',
        managerPhone: '',
      },
      { dma: 'Alpena MI',
        email: 'cprweo@goodmannetworks.com',
        managerName: 'Chris Prewo',
        managerPhone: '',
      },
      {
        dma: 'Cleveland OH',
        email: 'cprweo@goodmannetworks.com',
        managerName: 'Chris Prewo',
        managerPhone: '',
      },
      { dma: 'Detroit MI',
        email: 'cprweo@goodmannetworks.com',
        managerName: 'Chris Prewo',
        managerPhone: '',
      },
      { dma: 'Flint MI',
        email: 'cprweo@goodmannetworks.com',
        managerName: 'Chris Prewo',
        managerPhone: '',
      },
      {
        dma: 'Grand Rapids MI',
        email: 'cprweo@goodmannetworks.com',
        managerName: 'Chris Prewo',
        managerPhone: '',
      },
      { dma: 'Lansing MI',
        email: 'cprweo@goodmannetworks.com',
        managerName: 'Chris Prewo',
        managerPhone: '',
      },
      {
        dma: 'Traverse City MI',
        email: 'cprweo@goodmannetworks.com',
        managerName: 'Chris Prewo',
        managerPhone: '',
      },
      {
        dma: 'Bangor ME',
        email: 'slbradford@goodmannetworks.com',
        managerName: 'Scott Bradford',
        managerPhone: '',
      },
      {
        dma: 'Boston MA',
        email: 'slbradford@goodmannetworks.com',
        managerName: 'Scott Bradford',
        managerPhone: '',
      },
      {
        dma: 'Burlington VT',
        email: 'slbradford@goodmannetworks.com',
        managerName: 'Scott Bradford',
        managerPhone: '',
      },
      {
        dma: 'New York NY',
        email: 'slbradford@goodmannetworks.com',
        managerName: 'Scott Bradford',
        managerPhone: '',
      },
      {
        dma: 'Portland ME',
        email: 'slbradford@goodmannetworks.com',
        managerName: 'Scott Bradford',
        managerPhone: '',
      },
      {
        dma: 'Presque Isle ME',
        email: 'slbradford@goodmannetworks.com',
        managerName: 'Scott Bradford',
        managerPhone: '',
      },
      {
        dma: 'Jackson TN',
        email: 'zzdravkov@goodmannetworks.com',
        managerName: 'Zdravko Zdravkov',
        managerPhone: '',
      },
      {
        dma: 'Memphis TN',
        email: 'zzdravkov@goodmannetworks.com',
        managerName: 'Zdravko Zdravkov',
        managerPhone: '',
      },
      {
        dma: 'Paducah KY',
        email: 'zzdravkov@goodmannetworks.com',
        managerName: 'Zdravko Zdravkov',
        managerPhone: '',
      },
      {
        dma: "Alexandria LA",
        email: "so'donohue@goodmannetworks.com",
        managerName: "Scott O'Donohue",
        managerPhone: '',
      },
      {
        dma: "Baton Rouge LA",
        email: "so'donohue@goodmannetworks.com",
        managerName: "Scott O'Donohue",
        managerPhone: '',
      },
      {
        dma: "Lafayette LA",
        email: "so'donohue@goodmannetworks.com",
        managerName: "Scott O'Donohue",
        managerPhone: '',
      },
      {
        dma: "Lake Charles LA",
        email: "so'donohue@goodmannetworks.com",
        managerName: "Scott O'Donohue",
        managerPhone: '',
      },
      {
        dma: "Monroe LA",
        email: "so'donohue@goodmannetworks.com",
        managerName: "Scott O'Donohue",
        managerPhone: '',
      },
      {
        dma: "'Shreveport LA",
        email: "so'donohue@goodmannetworks.com",
        managerName: "Scott O'Donohue",
        managerPhone: '',
      },
      {
        dma: "Tyler TX",
        email: "so'donohue@goodmannetworks.com",
        managerName:"Scott O'Donohue",
        managerPhone: '',
      },
      {
        dma: 'Beaumont TX',
        email: 'vtruvillion@goodmannetworks.com',
        managerName: 'Vernon Truvillon',
        managerPhone: '',
      },
      {
        dma: 'Houston TX 1',
        email: 'vtruvillion@goodmannetworks.com',
        managerName: 'Vernon Truvillon',
        managerPhone: '',
      },
    ],
  }

  componentDidMount() {
    axios.get(`/api/tech/${this.props.location.query.employeeId}/row`)
    .then(res => {

      this.setState({row: res.data.row})
    })
  }
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
                  <OnTempTeamClaim variables={{row: this.state.row, tech: tech, dmas:this.state.dma}}></OnTempTeamClaim>
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
                        let array = data.workGroups
                        const workGroups = array.slice().sort((a, b) => a.type.localeCompare(b.type))
                        // _.flatten(
                        //   _.map(data.workGroups, workGroup =>
                        //     (workGroup.managers.length ? workGroup.managers : [{}]).map(manager => ({
                        //       workGroup,
                        //       manager,
                        //     }))
                        //   )
                        // )
                        const columns = [
                          { Header: 'Type', accessor: 'type' },
                          { Header: 'Name', accessor: 'name' },
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
