import React from 'react'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Input, Form, FormGroup, Label } from 'reactstrap'
import asNextJSPage from 'app/util/asNextJSPage'

import Layout from 'app/ui/Layout'
import DateRangePicker from 'app/ui/widgets/DateRangePIcker'
import SdcrTreeMap from 'app/ui/widgets/SdcrTreeMap'

class SDCR extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      scopeType: 'Company',
      scopeName: 'EMPATH',
      groupType: 'DMA',
      dateRange: {
        start: moment()
        .add(-1, 'day')
        .startOf('month')
        .format('YYYY-MM-DD'),
        end: moment()
        .add(-1, 'day')
        .format('YYYY-MM-DD'),
      },
    }
  }
  render() {
    const { dateRange, scopeType, scopeName, groupType } = this.state
    return (
      <Layout>
        <Card style={{ height: 'calc(100vh - 100px)' }}>
          <CardHeader style={{ position: 'relative' }}>
            {/*relative because card-actions is absolute*/}
            <i className="icon-menu" /> SDCR
            {/* <Button
                      className="card-actions mt-0 h-100"
                      color="primary"
                      onClick={() => {
                        const token = encodeURIComponent(cookie.parse(document.cookie).token)
                        const timezone = encodeURIComponent(moment.tz.guess())
                        const downloadUrl = config.host + '/download/techs' + `?token=${token}&timezone=${timezone}`
                        this.setState({ downloadUrl }, () => {
                          alert(
                            'The download should be starting.' +
                              " If it hasn't, verify that your popup blocker isn't preventing it from opening."
                          )
                        })
                      }}
                    >
                      <i className="fa fa-download fa-lg mr-1" /> Download Tech Data
                    </Button> */}
          </CardHeader>
          <CardBody className="p-0 d-flex flex-column">
            <Card className="m-0 bg-primary">
              <CardBody>
                <Form inline>
                  <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                    <Label for="scopeType" className="mr-sm-2">
                      Scope By
                    </Label>
                    <Input
                      id="scopeType"
                      type="select"
                      defaultValue={scopeType}
                      onChange={e => {
                        this.setState({ scopeType: e.target.value })
                      }}
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
                    <Label for="scopeName" className="mr-sm-2">
                      Named
                    </Label>
                    <Input
                      id="scopeName"
                      type="select"
                      defaultValue={scopeName}
                      onChange={e => {
                        this.setState({ scopeName: e.target.value })
                      }}
                    >
                      <option>EMPATH</option>
                    </Input>
                  </FormGroup>
                  <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                    <Label for="groupType" className="mr-sm-2">
                      Grouped By
                    </Label>
                    <Input
                      id="groupType"
                      type="select"
                      defaultValue={groupType}
                      onChange={e => {
                        this.setState({ groupType: e.target.value })
                      }}
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
                  <DateRangePicker
                    id="dateRange"
                    defaultRange={dateRange}
                    onChange={dateRange => {
                      this.setState({ dateRange })
                    }}
                  />
                </Form>
              </CardBody>
            </Card>
            <SdcrTreeMap
              className="bg-primary"
              style={{ flex: 1 }}
              {...{ scopeType, scopeName, dateRange, groupType }}
            />
          </CardBody>
        </Card>
      </Layout>
    )
  }
}

export default asNextJSPage(SDCR)
