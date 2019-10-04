import React from 'react'
import Layout from 'app/ui/Layout'
import moment from 'moment-timezone'
//import data from "app/apollo/data";
import { Card, CardHeader, CardBody, Row, Col, Input } from 'reactstrap'
import DownloadButton from 'app/ui/widgets/DownloadButton'
import DateRangePicker from 'app/ui/widgets/DateRangePIcker'

export default class TechDashUpSell extends React.Component {
  state = {
    dmaEmail: '',
    dateRange: {
      start: moment()
      .add(-1, 'day')
      .format('YYYY-MM-DD'),
      end: moment()
      .add(-1, 'day')
      .format('YYYY-MM-DD'),
    },
    dmaEmails: [
      {
        dma: 'Champaign IL - Mike Siebers',
        email: 'msiebers@goodmannetworks.com',
      },
      {
        dma: 'Davenport IA - Mike Siebers',
        email: 'msiebers@goodmannetworks.com',
      },
      {
        dma: 'Evansville IN - Mike Siebers',
        email: 'msiebers@goodmannetworks.com',
      },
      {
        dma: 'Indianapolis IN - Mike Siebers',
        email: 'msiebers@goodmannetworks.com',
      },
      {
        dma: 'Lafayette IN - Mike Siebers',
        email: 'msiebers@goodmannetworks.com',
      },
      {
        dma: 'Peoria IL - Mike Siebers',
        email: 'msiebers@goodmannetworks.com',
      },
      {
        dma: 'Cincinnati OH - Dave Kingery',
        email: 'dkingery@goodmannetworks.com',
      },
      {
        dma: 'Lexington KY - Dave Kingery',
        email: 'dkingery@goodmannetworks.com',
      },
      {
        dma: 'Louisville KY - Dave Kingery',
        email: 'dkingery@goodmannetworks.com',
      },
      { dma: 'Alpena MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      {
        dma: 'Cleveland OH - Chris Prewo',
        email: 'cprweo@goodmannetworks.com',
      },
      { dma: 'Detroit MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Flint MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      {
        dma: 'Grand Rapids MI - Chris Prewo',
        email: 'cprweo@goodmannetworks.com',
      },
      { dma: 'Lansing MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      {
        dma: 'Traverse City MI - Chris Prewo',
        email: 'cprweo@goodmannetworks.com',
      },
      {
        dma: 'Bangor ME - Scott Bradford',
        email: 'slbradford@goodmannetworks.com',
      },
      {
        dma: 'Boston MA - Scott Bradford',
        email: 'slbradford@goodmannetworks.com',
      },
      {
        dma: 'Burlington VT - Scott Bradford',
        email: 'slbradford@goodmannetworks.com',
      },
      {
        dma: 'New York NY - Scott Bradford',
        email: 'slbradford@goodmannetworks.com',
      },
      {
        dma: 'Portland ME - Scott Bradford',
        email: 'slbradford@goodmannetworks.com',
      },
      {
        dma: 'Presque Isle ME - Scott Bradford',
        email: 'slbradford@goodmannetworks.com',
      },
      {
        dma: 'Jackson TN - Zdravko Zdravkov',
        email: 'zzdravkov@goodmannetworks.com',
      },
      {
        dma: 'Memphis TN - Zdravko Zdravkov',
        email: 'zzdravkov@goodmannetworks.com',
      },
      {
        dma: 'Paducah KY - Zdravko Zdravkov',
        email: 'zzdravkov@goodmannetworks.com',
      },
      {
        dma: "Alexandria LA - Scott O'Donohue",
        email: "so'donohue@goodmannetworks.com",
      },
      {
        dma: "Baton Rouge LA - Scott O'Donohue",
        email: "so'donohue@goodmannetworks.com",
      },
      {
        dma: "Lafayette LA - Scott O'Donohue",
        email: "so'donohue@goodmannetworks.com",
      },
      {
        dma: "Lake Charles LA - Scott O'Donohue",
        email: "so'donohue@goodmannetworks.com",
      },
      {
        dma: "Monroe LA - Scott O'Donohue",
        email: "so'donohue@goodmannetworks.com",
      },
      {
        dma: "'Shreveport LA - Scott O'Donohue",
        email: "so'donohue@goodmannetworks.com",
      },
      {
        dma: "Tyler TX - Scott O'Donohue",
        email: "so'donohue@goodmannetworks.com",
      },
      {
        dma: 'Beaumont TX - Vernon Truvillon',
        email: 'vtruvillion@goodmannetworks.com',
      },
      {
        dma: 'Houston TX 1 - Vernon Truvillon',
        email: 'vtruvillion@goodmannetworks.com',
      },
    ],
  };
  update = (name, e) => {
    this.setState({ [name]: e.target.value })
  };

  render() {
    const { downloadUrl } = this.state
    return (
      <Layout>
        <Card>
          <CardHeader style={{ position: 'relative' }}>
            {/*relative because card-actions is absolute*/}
            <i className="icon-menu" /> TECH DASH END OF DAY EXECUTIVE SUMMARY
          </CardHeader>
          <CardBody className="p-5">
            <p>The Report Filters by DMA Regional Manager</p>
            <Input
              type="select"
              name="dmaEmails"
              id="dmaEmails"
              style={{ width: '100%', marginBottom: '20px' }}
              onChange={e => this.update('dmaEmail', e)}
            >
              <option value=""> CHOOSE DMA REGIONAL MANAGER</option>
              <option value="*">ALL</option>
              {this.state.dmaEmails.map((item, index) => (
                <option value={item.email} key={index}>
                  {item.dma}
                </option>
              ))}
            </Input>
            <Row>
              <Col>
                <DateRangePicker
                  id="dateRange"
                  defaultRange={this.state.dateRange}
                  onChange={dateRange => {
                    this.setState({ dateRange })
                  }}
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <DownloadButton
                  endpoint="techDashReport"
                  params={{ type: 'CE', dmaEmail: this.state.dmaEmail, startDate: this.state.dateRange.start, endDate: this.state.dateRange.end }}
                  className="card-actions mt-0 h-100"
                  color="primary"
                >
                  DOWNLOAD CE DATA
                </DownloadButton>
              </Col>
              <Col>
                <DownloadButton
                  endpoint="techDashReport"
                  params={{ type: 'UPSELL', dmaEmail: this.state.dmaEmail, startDate: this.state.dateRange.start, endDate: this.state.dateRange.end}}
                  className="card-actions mt-0 h-100"
                  color="primary"
                >
                  DOWNLOAD UPSELL DATA
                </DownloadButton>
              </Col>
            </Row>




          </CardBody>
          {downloadUrl && (
            <iframe style={{ display: 'none' }} src={downloadUrl} />
          )}
        </Card>
      </Layout>
    )
  }
}
