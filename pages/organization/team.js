import React from 'react'
import ReactTable from 'react-table'
import { Query } from 'react-apollo'
import axios from 'axios'
import Link from 'next/link'
import moment from 'moment-timezone'
import DateRangePicker from 'app/ui/widgets/DateRangePIcker'
import alert from 'sweetalert'

import { Row, Col, Card, CardHeader, CardBody, Table, Button, Input } from 'reactstrap'
// import alert from 'sweetalert'
// import Link from 'next/link'
import _ from 'lodash'

import ApolloData from 'app/apollo/data'

import Layout from 'app/ui/Layout'

export default class Team extends React.Component {
  constructor(props){
    super()
  }
  state = {
    currentWorkGroup: {
      id: '',
      type: '',
      name: '',
      externalId: '',
    },
    dateRange: {
      start: moment()
      .add(-1, 'day')
      .format('YYYY-MM-DD'),
      end: moment()
      .add(-1, 'day')
      .format('YYYY-MM-DD'),
    },
    tempClaim: {
      tempClaimId: '',
      tempClaimTeamId: '',
      tempClaimTeamName: '',
      tempClaimFromDate:'',
      tempClaimToDate: '',
    },
    choosenTeam: {
      id: '',
      type: '',
      name: '',
      externalId: '',
    },
    techs: [],
    dma: [{}],
  }

  componentDidMount() {
    axios.get(`/api/team/${this.props.location.query.workGroupId}/techs`)
    .then(res => {
      const mappedTechs = res.data.map(i => {
        i.company = {name: 'DirecTV'}
        return i
      })
      this.setState({techs: mappedTechs})
    })
  }

  onClaim(e){
    e.preventDefault()
    const {choosenTeam, dateRange} = this.state
    this.onAccept({
      tempClaimId: choosenTeam.id,
      tempClaimTeamId: choosenTeam.externalId,
      tempClaimTeamName: choosenTeam.name,
      tempClaimFromDate: moment(dateRange.start).toDate(),
      tempClaimToDate: moment(dateRange.end).toDate(),
    })
  }

  onAccept(tempClaim) {
    console.log(tempClaim)
    axios.post(`/api/team/${this.props.location.query.workGroupId}/claim`, tempClaim
    )
    .then(function (response) {
      alert('Great!', 'Team has be claimed for the period chosen', 'success')
      console.log(response)
    })
    .catch(function (error) {
      const {message} = error.response.data
      alert('Try Again,', message, 'warning')
    })
  }

  render() {
    const { workGroupId } = this.props.location.query
    const { techs } = this.state
    const columns = [
      {
        Header: 'Employee ID',
        accessor: 'externalId',
        Cell: ({ original }) => (
          <Link shallow href={`/organization/tech/${original.id}`}>
            <a href="#">{original.externalId}</a>
          </Link>
        ),
      },
      { Header: 'Employee', accessor: 'name' },
      { Header: 'Phone', accessor: 'phoneNumber' },
      {
        Header: 'Company',
        accessor: 'company.name',
      },
    ]
    return (
      <Layout>
        <Query {...ApolloData.WorkGroup.QUERY_workGroupTechs} variables={{ id: workGroupId }} fetchPolicy="cache-and-network">
          {({ loading, data }) => {
            if (loading || !data)
              return (
                <Row>
                  <Col>Loading...</Col>
                </Row>
              )
            const { workGroup } = data
            return (
              <div>
                <Row>
                  <Col>
                    <h2>{workGroup.name+ "'s"} Team</h2>
                  </Col>
                  <Col style={{ textAlign: 'end' }}>
                  </Col>
                </Row>
                <Row>
                  <Col xs="12" md="6">
                    <Card>
                      <CardHeader>Basic Info</CardHeader>
                      <CardBody className="p-0">
                        <Table className="m-0" striped>
                          <tbody>
                            <tr>
                              <th>Team ID</th>
                              <td>{workGroup.externalId}</td>
                            </tr>
                            <tr>
                              <th>Team Supervisor</th>
                              <td>{workGroup.name}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </CardBody>
                    </Card>
                  </Col>
                  <Query {...ApolloData.WorkGroup.QUERY} variables={{ order: 6}} fetchPolicy="cache-and-network">
                    {({ loading, data }) => {
                      if(loading){
                        return(
                          <h2>...Loading</h2>
                        )
                      }else{
                        const workGroups = data.workGroups.slice().sort((a, b) => a.name.localeCompare(b.name) && a.externalId.localeCompare(b.externalId) )
                        return(
                          <Col xs="12" md="6">
                            <Card>
                              <CardHeader>Claim Team Temporarily</CardHeader>
                              <CardBody className="p-0">
                                <Table className="m-0" striped>
                                  <tbody>
                                    <tr>
                                      <th>TEMPORAL OWNER OF THIS TEAM</th>
                                      <td>
                                      <Input
                                          type="select"
                                          name="workGroup"
                                          id="workGroup"
                                          style={{ width: '100%', marginBottom: '20px' }}
                                          onChange={e => this.setState({choosenTeam: workGroups[e.target.value], currentWorkGroup: workGroup})}>
                                          <option value=""> CHOOSE OWNER</option>
                                          { workGroups.map((item, index) => (
                                            <option value={index} key={index}>
                                              {item.externalId + '  -  ' + item.name}
                                            </option>
                                          ))}
                                        </Input>
                                      </td>
                                    </tr>
                                    <tr>
                                      <th>DURATION</th>
                                      <td>
                                        <DateRangePicker
                                          id="dateRange"
                                          defaultRange={this.state.dateRange}
                                          onChange={dateRange => {
                                            this.setState({ dateRange })
                                          }}
                                        /></td>
                                    </tr>
                                    <tr>
                                      <th>CLAIM</th>
                                      <td>
                                        <Button onClick={e => this.onClaim(e)}>Accept</Button>
                                      </td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </CardBody>

                            </Card>
                          </Col>
                        )
                      }

                    }}
                  </Query>
                </Row>
                <Row>

                  <Col>
                    <Card>
                      <CardHeader style={{ position: 'relative' }}>

                        <i className="icon-menu" /> Work Group Techs
                      </CardHeader>
                      <CardBody className="p-0">
                        <ReactTable
                          style={{ backgroundColor: 'white' }}
                          filterable
                          className="-striped -highlight"
                          loading={!techs && techs === ''}
                          data={techs}
                          showPaginationBottom={false}
                          defaultPageSize={7}
                          pageSize={techs && techs.length}
                          columns={columns}
                          defaultFilterMethod={(filter, row) =>
                            String(row[filter.id])
                            .toLowerCase()
                            .indexOf(String(filter.value).toLowerCase()) !== -1
                          }
                        />
                      </CardBody>
                    </Card>
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