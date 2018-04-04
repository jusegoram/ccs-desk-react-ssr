import React from 'react'

import { Col, Container, Row, CardGroup, Card, CardBody } from 'reactstrap'

class Loader extends React.Component {
  render() {
    return (
      <div className="app flex-row align-items-center">
        <Container>
          <Row className="justify-content-center">
            <Col md="8" lg="5">
              <CardGroup className="mb-4">
                <Card className="p-4">
                  <CardBody style={{ textAlign: 'center' }}>
                    <h1>Loading...</h1>
                    <div className="sk-cube-grid">
                      <div className="sk-cube sk-cube1" />
                      <div className="sk-cube sk-cube2" />
                      <div className="sk-cube sk-cube3" />
                      <div className="sk-cube sk-cube4" />
                      <div className="sk-cube sk-cube5" />
                      <div className="sk-cube sk-cube6" />
                      <div className="sk-cube sk-cube7" />
                      <div className="sk-cube sk-cube8" />
                      <div className="sk-cube sk-cube9" />
                    </div>
                  </CardBody>
                </Card>
              </CardGroup>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default Loader
