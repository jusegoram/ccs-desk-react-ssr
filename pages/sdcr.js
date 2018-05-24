import React from 'react'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Input, Form, FormGroup, Label, Button, Container, Row, Col } from 'reactstrap'
import axios from 'axios'
import _ from 'lodash'

import Layout from 'app/ui/Layout'
import DateRangePicker from 'app/ui/widgets/DateRangePIcker'
import SdcrTreeMap from 'app/ui/widgets/SdcrTreeMap'
import Toggle from 'app/ui/widgets/Toggle'
import DownloadButton from 'app/ui/widgets/DownloadButton'

class SDCR extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      scopeType: 'Company',
      scopeName: null,
      scopeNameOptions: null,
      scopeNameOptionsLoading: false,
      scopeNameAfterLoad: null,
      groupType: 'DMA',
      workOrderType: 'Production',
      dateRange: {
        start: moment()
        .add(-2, 'day')
        .format('YYYY-MM-DD'),
        end: moment()
        .add(-2, 'day')
        .format('YYYY-MM-DD'),
      },
    }
  }
  populateScopeNameList() {
    const { scopeType, scopeNameOptionsLoading, scopeNameAfterLoad } = this.state
    if (!scopeNameOptionsLoading) {
      axios
      .get('/api/workGroup', { params: { type: scopeType } })
      .then(res => {
        const scopeNameOptions = _.map(res.data, 'name')
        this.setState({
          scopeNameOptionsLoading: false,
          scopeName: scopeNameAfterLoad || scopeNameOptions[0],
          scopeNameOptions,
          scopeNameAfterLoad: null,
        })
      })
      .catch(console.error)
      this.setState({ scopeNameOptionsLoading: true })
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.scopeType !== this.state.scopeType) this.populateScopeNameList()
  }
  componentDidMount() {
    this.populateScopeNameList()
  }
  render() {
    const { dateRange, scopeType, scopeName, groupType, scopeNameOptions, workOrderType } = this.state
    const workOrderTypeOptions = [{ name: 'Production', value: 'Production' }, { name: 'Repairs', value: 'Repairs' }]
    return (
      <Layout>
        <Card style={{ height: 'calc(100vh - 100px)' }}>
          <CardHeader style={{ position: 'relative' }}>
            {/*relative because card-actions is absolute*/}
            <i className="icon-menu" /> SDCR
            <DownloadButton
              endpoint="sdcr"
              params={{ scopeType, scopeName, dateRange, groupType, workOrderType }}
              className="card-actions mt-0 h-100"
              color="primary"
            >
              Download Data
            </DownloadButton>
          </CardHeader>
          <CardBody className="p-0 d-flex flex-column">
            <Card className="m-0 bg-primary">
              <CardBody>
                <Form inline>
                  <Container fluid>
                    <Row>
                      <Col xs="6" lg="4">
                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                          <Label for="scopeType" className="mr-sm-2" style={{ width: '100px' }}>
                            Scope By
                          </Label>
                          <Input
                            id="scopeType"
                            type="select"
                            value={scopeType}
                            onChange={e => {
                              this.setState({ scopeType: e.target.value })
                            }}
                            style={{ width: '170px' }}
                          >
                            <option>Company</option>
                            <option>Subcontractor</option>
                            <option>Division</option>
                            <option>DMA</option>
                            <option>Office</option>
                            <option>Service Region</option>
                            <option>Team</option>
                            <option>Tech</option>
                          </Input>
                        </FormGroup>
                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                          <Label for="scopeName" className="mr-sm-2" style={{ width: '100px' }}>
                            Scope Name
                          </Label>
                          {(scopeNameOptions && (
                            <Input
                              id="scopeName"
                              type="select"
                              value={scopeName}
                              onChange={e => {
                                this.setState({ scopeName: e.target.value })
                              }}
                              style={{ width: '170px' }}
                            >
                              {scopeNameOptions.map(name => <option key={name}>{name}</option>)}
                            </Input>
                          )) || <Input type="text" placeholder="Loading..." disabled style={{ width: '170px' }} />}
                        </FormGroup>
                      </Col>
                      <Col xs="6" lg="4">
                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                          <Label for="groupType" className="mr-sm-2" style={{ width: '100px' }}>
                            Grouped By
                          </Label>
                          <Input
                            id="groupType"
                            type="select"
                            defaultValue={groupType}
                            onChange={e => {
                              this.setState({ groupType: e.target.value })
                            }}
                            style={{ width: '170px' }}
                          >
                            <option>Company</option>
                            <option>Subcontractor</option>
                            <option>Division</option>
                            <option>DMA</option>
                            <option>Office</option>
                            <option>Service Region</option>
                            <option>Team</option>
                            <option>Tech</option>
                          </Input>{' '}
                        </FormGroup>
                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                          <Label className="mr-sm-2" style={{ width: '100px' }}>
                            Order Type
                          </Label>
                          <Toggle
                            options={workOrderTypeOptions}
                            selected={workOrderType}
                            onChange={workOrderType => {
                              this.setState({ workOrderType })
                            }}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs="6" lg="4">
                        <DateRangePicker
                          id="dateRange"
                          defaultRange={dateRange}
                          onChange={dateRange => {
                            this.setState({ dateRange })
                          }}
                        />
                      </Col>
                    </Row>
                  </Container>
                </Form>
              </CardBody>
            </Card>
            {scopeType &&
              scopeName &&
              dateRange &&
              groupType && (
              <SdcrTreeMap
                className="bg-primary"
                style={{ flex: 1 }}
                {...{ scopeType, scopeName, dateRange, groupType, workOrderType }}
                onClick={data => {
                  this.setState({
                    scopeType: groupType,
                    scopeNameAfterLoad: data.name
                    .split(' ')
                    .slice(0, -1)
                    .join(' '),
                  })
                }}
              />
            )}
          </CardBody>
        </Card>
      </Layout>
    )
  }
}

export default SDCR
