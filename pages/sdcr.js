import React from 'react'
import { Treemap } from 'react-vis'
import { Query } from 'react-apollo'
import moment from 'moment-timezone'
import { Card, CardHeader, CardBody, Button, Container, Row, Col } from 'reactstrap'
import alert from 'sweetalert'
import axios from 'axios'
import componentQueries from 'react-component-queries'

import asNextJSPage from 'app/util/asNextJSPage'
import data from 'app/apollo/data'

import Layout from 'app/ui/Layout'
import DateRangePicker from 'app/ui/widgets/DateRangePIcker'
import SdcrTreeMap from 'app/ui/widgets/SdcrTreeMap'

class SDCR extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
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
    const { dateRange } = this.state
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
            <Card className="m-0" style={{ backgroundColor: '#2d3446' }}>
              <CardBody>
                <DateRangePicker
                  defaultRange={dateRange}
                  onChange={dateRange => {
                    this.setState({ dateRange })
                  }}
                />
              </CardBody>
            </Card>
            <SdcrTreeMap style={{ flex: 1 }} dateRange={dateRange} />
          </CardBody>
        </Card>
      </Layout>
    )
  }
}

export default asNextJSPage(SDCR)
