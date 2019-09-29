import React from 'react'
import Layout from 'app/ui/Layout'
import { Mutation } from 'react-apollo'
import ApolloData from 'app/apollo/data'
import Router from 'next/router'
import alert from 'sweetalert'

import {
  Card,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
} from 'reactstrap'

export default class TechDashConsumerElectronics extends React.Component {
  //TODO: PAGE1 - COLLECT INFORMATION --> PAGE 2 - EMAIL INFORMATION
  //TODO: INBOXES - support@techdash.com
  //TODO: DMA DROPDOWN ON ALL CASES FOR EMAIL - (DMA REGION) DMAEMAIL@email.com
  //
  state = {
    brand: '',
    customerAccountNumber: '',
    customerName: '',
    customerPhoneNumber: '', //ID for database relationships;
    customerAddress: '',
    typeOfComplaint: '',
    deviceModelNumber: '',
    deviceSerialNumber: '',
    deviceError: '',
    callToCust1: '',
    callToCust2: '',
    callToCust3: '',
    callNotes: '',
    inboxEmail: 'support@techdash.com',
    dmaEmail: '',
    dmaEmails: [
      { dma: 'Champaign IL - Mike Siebers', email: 'msiebers@goodmannetworks.com' },
      { dma: 'Davenport IA - Mike Siebers', email: 'msiebers@goodmannetworks.com' },
      { dma: 'Evansville IN - Mike Siebers', email: 'msiebers@goodmannetworks.com' },
      { dma: 'Indianapolis IN - Mike Siebers', email: 'msiebers@goodmannetworks.com' },
      { dma: 'Lafayette IN - Mike Siebers', email: 'msiebers@goodmannetworks.com' },
      { dma: 'Peoria IL - Mike Siebers', email: 'msiebers@goodmannetworks.com' },
      { dma: 'Cincinnati OH - Dave Kingery', email: 'dkingery@goodmannetworks.com' },
      { dma: 'Lexington KY - Dave Kingery', email: 'dkingery@goodmannetworks.com' },
      { dma: 'Louisville KY - Dave Kingery', email: 'dkingery@goodmannetworks.com' },
      { dma: 'Alpena MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Cleveland OH - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Detroit MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Flint MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Grand Rapids MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Lansing MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Traverse City MI - Chris Prewo', email: 'cprweo@goodmannetworks.com' },
      { dma: 'Bangor ME - Scott Bradford', email: 'slbradford@goodmannetworks.com' },
      { dma: 'Boston MA - Scott Bradford', email: 'slbradford@goodmannetworks.com' },
      { dma: 'Burlington VT - Scott Bradford', email: 'slbradford@goodmannetworks.com' },
      { dma: 'New York NY - Scott Bradford', email: 'slbradford@goodmannetworks.com' },
      { dma: 'Portland ME - Scott Bradford', email: 'slbradford@goodmannetworks.com' },
      { dma: 'Presque Isle ME - Scott Bradford', email: 'slbradford@goodmannetworks.com' },
      { dma: 'Jackson TN - Zdravko Zdravkov', email: 'zzdravkov@goodmannetworks.com' },
      { dma: 'Memphis TN - Zdravko Zdravkov', email: 'zzdravkov@goodmannetworks.com' },
      { dma: 'Paducah KY - Zdravko Zdravkov', email: 'zzdravkov@goodmannetworks.com' },
      { dma: "Alexandria LA - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma: "Baton Rouge LA - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma: "Lafayette LA - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma: "Lake Charles LA - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma: "Monroe LA - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma: "'Shreveport LA - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma:"Tyler TX - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma: 'Beaumont TX - Vernon Truvillon', email: 'vtruvillion@goodmannetworks.com' },
      { dma: 'Houston TX 1 - Vernon Truvillon', email: 'vtruvillion@goodmannetworks.com' },
    ],
  };
  update = (name, e) => {
    this.setState({ [name]: e.target.value })
  };

  render() {
    return (
      <Layout className="p-2">
        <h4>TECH DASH CONSUMER ELECTRONICS</h4>

        <Card className="p-5">
          <Mutation {...ApolloData.TechDashConsumerElectronics.M_addRecord}>
            {addRecord => (
              <Form>
                <FormGroup>
                  <Label for="exampleSelect">SELECT BRAND</Label>
                  <Input
                    type="select"
                    name="select"
                    id="exampleSelect"
                    value={this.state.brand}
                    onChange={e => this.update('brand', e)}
                  >
                    <option value="">SELECT BRAND</option>
                    <option>LG</option>
                    <option>Electrolux</option>
                    <option>Magic Chief</option>
                    <option>AIG</option>
                    <option>Assurance</option>
                    <option>Square Trade</option>
                    <option>Safeway</option>
                    <option>Amazon</option>
                    <option>Assurion</option>
                  </Input>
                </FormGroup>

                <FormGroup>
                  <Label for="accountNumber">ACCOUNT NUMBER</Label>
                  <Input
                    type="text"
                    name="accountNumber"
                    id="accountNumber"
                    placeholder="100000001"
                    value={this.state.customerAccountNumber}
                    onChange={e => this.update('customerAccountNumber', e)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="customerName">CUSTOMER NAME</Label>
                  <Input
                    type="text"
                    name="customerName"
                    id="customerName"
                    placeholder="John Doe"
                    value={this.state.customerName}
                    onChange={e => this.update('customerName', e)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="customerPhoneNumber">CUSTOMER PHONE NUMBER</Label>
                  <Input
                    type="text"
                    name="customerPhoneNumber"
                    id="customerPhoneNumber"
                    placeholder="301 - 000 - 1234"
                    value={this.state.customerPhoneNumber}
                    onChange={e => this.update('customerPhoneNumber', e)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="customerAddress">CUSTOMER ADDRESS</Label>
                  <Input
                    type="text"
                    name="customerAddress"
                    id="customerAddress"
                    placeholder=" 123 Lane Blv, Lexington, KY"
                    value={this.state.customerAddress}
                    onChange={e => this.update('customerAddress', e)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="typeOfComplaint">TYPE OF COMPLAINT</Label>
                  <Input
                    type="select"
                    name="typeOfComplaint"
                    id="typeOfComplaint"
                    value={this.state.typeOfComplaint}
                    onChange={e => this.update('typeOfComplaint', e)}
                  >
                    <option>DAMAGE ON ARRIVAL</option>
                    <option>POOR QUALITY</option>
                    <option>MISSING PARTS</option>
                    <option>WRONG PRODUCT IN THE BOX</option>
                    <option>HIGH PRICE</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="deviceModelNumber">MODEL NUMBER OF DEVICE</Label>
                  <Input
                    type="text"
                    name="deviceModelNumber"
                    id="deviceModelNumber"
                    placeholder="(LG) MNS1234 "
                    value={this.state.deviceModelNumber}
                    onChange={e => this.update('deviceModelNumber', e)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="deviceSerialNumber">
                    SERIAL NUMBER OF DEVICE
                  </Label>
                  <Input
                    type="text"
                    name="deviceSerialNumber"
                    id="deviceSerialNumber"
                    placeholder="12345-13213SABC"
                    value={this.state.deviceSerialNumber}
                    onChange={e => this.update('deviceSerialNumber', e)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="deviceError">
                    ERROR CODES OF DEVICES OR RELEVANT INFORMATION OF COMPLAINT
                  </Label>
                  <Input
                    type="textarea"
                    name="deviceError"
                    id="deviceError"
                    placeholder="Error Codes / Relevant Info."
                    value={this.state.deviceError}
                    onChange={e => this.update('deviceError', e)}
                  />
                </FormGroup>
                <Label for="callToCust1">CUSTOMER CALLS </Label>
                <Row>
                  <Col>
                    <FormGroup>
                      <Label for="callToCust1">CALL 1</Label>
                      <Input
                        type="select"
                        name="callToCust1"
                        id="callToCust1"
                        value={this.state.callToCust1}
                        onChange={e => this.update('callToCust1', e)}
                      >
                        <option value="">SELECT FOR 1ST CALL</option>
                        <option> NALVM </option>
                        <option> NA </option>
                        <option> CONTACT MADE </option>
                        <option>WRONG NUMBER</option>
                        <option>DISCONNECTED NUMBER</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col>
                    <FormGroup>
                      <Label for="callToCust2">CALL 2</Label>
                      <Input
                        type="select"
                        name="callToCust2"
                        id="callToCust2"
                        value={this.state.callToCust2}
                        onChange={e => this.update('callToCust2', e)}
                      >
                        <option value="">SELECT FOR 2ND CALL</option>
                        <option> NALVM </option>
                        <option> NA </option>
                        <option> CONTACT MADE </option>
                        <option>WRONG NUMBER</option>
                        <option>DISCONNECTED NUMBER</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col>
                    <FormGroup>
                      <Label for="callToCust3">CALL 3</Label>
                      <Input
                        type="select"
                        name="callToCust3"
                        id="callToCust3"
                        value={this.state.callToCust3}
                        onChange={e => this.update('callToCust3', e)}
                      >
                        <option value="">SELECT FOR 3RD CALL</option>
                        <option> NALVM </option>
                        <option> NA </option>
                        <option> CONTACT MADE </option>
                        <option>WRONG NUMBER</option>
                        <option>DISCONNECTED NUMBER</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label for="callNotes">NOTES OF CALL</Label>
                  <Input
                    type="textarea"
                    name="callNotes"
                    id="callNotes"
                    value={this.state.callNotes}
                    onChange={e => this.update('callNotes', e)}
                  />
                </FormGroup>
                <Label for="dmaEmails">SEND EMAIL TO DMA MANAGER</Label>
                <Row>
                  <Col>
                    <Input
                      type="select"
                      name="dmaEmails"
                      id="dmaEmails"
                      onChange={e => this.update('dmaEmail', e)}
                    >
                      <option value=""> CHOOSE DMA </option>
                      {this.state.dmaEmails.map((item, index) => (
                        <option key={index} value={item.email}>
                          {item.dma}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col>
                    <Button
                      color="primary"
                      className="px-4"
                      onClick={async () => {
                        const {
                          brand,
                          customerAccountNumber,
                          customerName,
                          customerPhoneNumber,
                          customerAddress,
                          typeOfComplaint,
                          deviceModelNumber,
                          deviceSerialNumber,
                          deviceError,
                          callToCust1,
                          callToCust2,
                          callToCust3,
                          callNotes,
                          inboxEmail,
                          dmaEmail,
                        } = this.state
                        await addRecord({
                          variables: {
                            brand,
                            customerAccountNumber,
                            customerName,
                            customerPhoneNumber,
                            customerAddress,
                            typeOfComplaint,
                            deviceModelNumber,
                            deviceSerialNumber,
                            deviceError,
                            callToCust1,
                            callToCust2,
                            callToCust3,
                            callNotes,
                            inboxEmail,
                            dmaEmail,
                          },
                        })
                        alert('Success', 'Email Sent!', 'success')
                        Router.replace('/')
                      }}
                    >
                      Send Email
                    </Button>
                  </Col>
                </Row>
              </Form>
            )}
          </Mutation>
        </Card>
      </Layout>
    )
  }
}
