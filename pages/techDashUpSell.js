import React from 'react'
import Layout from 'app/ui/Layout'
import { Mutation } from 'react-apollo'
import ApolloData from 'app/apollo/data'
import Router from 'next/router'
import alert from 'sweetalert'

//import data from "app/apollo/data";
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

export default class TechDashUpSell extends React.Component {
  state = {
    case: '-1',
    message: '',
    product: '',
    customerAccountNumber: '',
    customerName: '',
    customerPhoneNumber: '',
    customerAddress: '',
    receiptNotes: '',
    typeOfComplaint: '',
    complaintDetails: '',
    problemDetails: '',
    callToCust1: '',
    callToCust2: '',
    callToCust3: '',
    callNotes: '',
    inboxEmail: '',
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
      { dma: "Tyler TX - Scott O'Donohue", email: "so'donohue@goodmannetworks.com" },
      { dma: 'Beaumont TX - Vernon Truvillon', email: 'vtruvillion@goodmannetworks.com' },
      { dma: 'Houston TX 1 - Vernon Truvillon', email: 'vtruvillion@goodmannetworks.com' },
    ],

    cases: [
      {
        value: '0',
        message: 'CUST. CALLS FOR RECEIPT/INVOICE/PAYMENT',
        email: 'lexington_metrics@goodmannetworks.com',
      },
      {
        value: '1',
        message: 'CUST. CALLS FOR COMPLAINT',
        email: 'support@techdash.com',

      },
      {
        value: '2',
        message: 'CUST. CALLS FOR TECHNICAL SUPPORT/PROBLEMS',
        email: 'support@techdash.com',
      },
      {
        value: '3',
        message: 'CUST. CALLS FOR OTHER REASONS',
        email: 'support@techdash.com',
      },
    ],
  };

  update = (name, e) => {
    if (name === 'case') {
      this.setState({
        case: e.target.value,
        message: this.state.cases[e.target.value].message,
        inboxEmail: this.state.cases[e.target.value].email,
      })
    } else {
      this.setState({ [name]: e.target.value })
    }
  };


  render() {
    //TODO: FLOW - PAGE 1 Capture data - PAGE 2 Email data
    //TODO: EMAIL TEMPLATE - Strictly the information. subject last name.
    //TODO: INBOXES - support@techdash.com
    //TODO: DMA DROPDOWN ON ALL CASES FOR EMAIL - (DMA REGION) DMAEMAIL@email.com

    return (
      <Layout className="p-2">
        <h4>TECH DASH UP SELL</h4>
        <Card className="p-5">
          <Mutation {...ApolloData.TechDashUpSell.M_addRecord}>
            {addRecord => (
              <Form>
                <Input
                  type="select"
                  name="cases"
                  id="cases"
                  onChange={e => this.update('case', e)}
                >
                  <option value="-1"> CHOOSE CALL TYPE </option>
                  {this.state.cases.map(item => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.message}
                    </option>
                  ))}
                </Input>
                {this.state.case !== '-1' && (
                  <div>

                    <FormGroup>
                      <Label for="productSelect">SELECT PRODUCT</Label>
                      <Input type="select" name="select" id="productSelect" onChange={e => this.update('product', e)}>
                        <option>SELECT PRODUCT</option>
                        <option>TP-LINK Wi-Fi Range Extender Dual Band</option>
                        <option>BELKIN Surge Protector W/USB Charging</option>
                        <option>TRIPP-LITE Surge Protector</option>
                        <option>AXIOM High Speed Gold Plated HDMI Cable</option>
                        <option>TECHTONIC Enviro Safe Screen Cleaner Kit</option>
                        <option>OTHER</option>
                      </Input>
                    </FormGroup>
                    <FormGroup>
                      <Label for="customerAccountNumber">ACCOUNT NUMBER</Label>
                      <Input
                        type="text"
                        name="customerAccountNumber"
                        id="customerAccountNumber"
                        placeholder="100000001"
                        onChange={e => this.update('customerAccountNumber', e)}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label for="customerName">FULL NAME</Label>
                      <Input
                        type="text"
                        name="customerName"
                        id="customerName"
                        placeholder="John Doe"
                        onChange={e => this.update('customerName', e)}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label for="customerPhoneNumber"> PHONE NUMBER</Label>
                      <Input
                        type="text"
                        name="customerPhoneNumber"
                        id="customerPhoneNumber"
                        placeholder="301 - 000 - 1234"
                        onChange={e => this.update('customerPhoneNumber', e)}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label for="customerAddress"> ADDRESS</Label>
                      <Input
                        type="text"
                        name="customerAddress"
                        id="customerAddress"
                        placeholder="123 Lane Blv, Lexington, KY"
                        onChange={e => this.update('customerAddress', e)}
                      />
                    </FormGroup>
                    {this.state.case === '0' && (
                      <FormGroup>
                        <Label for="receiptNotes">NOTES OF receipt</Label>
                        <Input
                          type="textarea"
                          name="receiptNotes"
                          id="notes"
                          placeholder="Relevant Details"
                          onChange={e => this.update('receiptNotes', e)}
                        />
                      </FormGroup>
                    )}
                    {this.state.case === '1' && (
                      <div>
                        <FormGroup>
                          <Label for="typeOfComplaint">COMPLAINT TYPE</Label>
                          <Input
                            type="select"
                            name="select"
                            id="typeOfComplaint"
                            onChange={e => this.update('typeOfComplaint', e)}
                          >
                            <option>CHOOSE COMPLAINT</option>
                            <option>TECHNICIAN</option>
                            <option>SERVICES</option>
                            <option>DAMAGE CLAIM</option>
                            <option>BAD DRIVER</option>
                            <option>OTHER</option>
                          </Input>
                        </FormGroup>
                        <FormGroup>
                          <Label for="complaintDetails">COMPLAINT DETAILS</Label>
                          <Input
                            type="textarea"
                            name="complaintDetails"
                            id="complaintDetails"
                            placeholder="Relevant Details specially if OTHER is marked on any dropdown"
                            onChange={e => this.update('complaintDetails', e)}
                          />
                        </FormGroup>
                      </div>
                    )}
                    {this.state.case === '2' && (

                      <FormGroup>
                        <Label for="problemDetails">DETAILS OF ERROR</Label>
                        <Input
                          type="textarea"
                          name="problemDetails"
                          id="problemDetails"
                          placeholder="Relevant Details"
                          onChange={e => this.update('problemDetails', e)}
                        />
                      </FormGroup>

                    )}
                    {this.state.case === '3' && (
                      <FormGroup>
                        <Label for="notes">DETAILS OF ISSUE</Label>
                        <Input
                          type="textarea"
                          name="notes"
                          id="notes"
                          placeholder="Relevant Details"
                          onChange={e => this.update('problemDetails', e)}
                        />
                      </FormGroup>
                    )}

                    <Row>
                      <Col>
                        <FormGroup>
                          <Label for="callToCust1">CALL 1</Label>
                          <Input
                            type="select"
                            name="callToCust1"
                            id="callToCust1"
                            onChange={e => this.update('callToCust1', e)}
                          >
                            <option>CHOOSE CALL OUTCOME</option>
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
                          <Label for="call2">CALL 2</Label>
                          <Input type="select" name="call2" id="call2" onChange={e => this.update('callToCust2', e)}>
                            <option>CHOOSE CALL OUTCOME</option>
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
                          <Label for="call3">CALL 3</Label>
                          <Input type="select" name="call3" id="call3" onChange={e => this.update('callToCust3', e)}>
                            <option>CHOOSE CALL OUTCOME</option>
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
                      <Label for="notes">NOTES OF CALL</Label>
                      <Input
                        type="textarea"
                        name="callNotes"
                        id="callNotes"
                        onChange={e => this.update('callNotes', e)} />
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
                            <option value={item.email} key={index}>
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
                              message,
                              product,
                              customerAccountNumber,
                              customerName,
                              customerPhoneNumber,
                              customerAddress,
                              receiptNotes,
                              typeOfComplaint,
                              complaintDetails,
                              problemDetails,
                              callToCust1,
                              callToCust2,
                              callToCust3,
                              callNotes,
                              inboxEmail,
                              dmaEmail,
                            } = this.state
                            await addRecord({
                              variables: {
                                message,
                                product,
                                customerAccountNumber,
                                customerName,
                                customerPhoneNumber,
                                customerAddress,
                                receiptNotes,
                                typeOfComplaint,
                                complaintDetails,
                                problemDetails,
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
                  </div>

                )}
              </Form>
            )}
          </Mutation>
        </Card>
      </Layout>
    )
  }
}
