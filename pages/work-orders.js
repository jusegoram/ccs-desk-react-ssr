import React from 'react'
import { Card, CardHeader, CardBody, Input } from 'reactstrap'
import moment from 'moment-timezone'
import { Sunburst, LabelSeries } from 'react-vis'

import asNextJSPage from 'app/util/asNextJSPage'

import DownloadButton from 'app/ui/widgets/DownloadButton'
import Layout from 'app/ui/Layout'
import axios from 'axios'

const LABEL_STYLE = {
  fontSize: '8px',
  textAnchor: 'middle',
}

function getKeyPath(node) {
  if (!node.parent) {
    return ['Hover For Info']
  }

  return [(node.data && node.data.name) || node.name].concat(getKeyPath(node.parent))
}
const EXTENDED_DISCRETE_COLOR_RANGE = [
  '#19CDD7',
  '#DDB27C',
  '#88572C',
  '#FF991F',
  '#F15C17',
  '#223F9A',
  '#DA70BF',
  '#125C77',
  '#4DC19C',
  '#776E57',
  '#12939A',
  '#17B8BE',
  '#F6D18A',
  '#B7885E',
  '#FFCB99',
  '#F89570',
  '#829AE3',
  '#E79FD5',
  '#1E96BE',
  '#89DAC1',
  '#B3AD9E',
]

function updateData(data, keyPath) {
  if (data.children) {
    data.children.map(child => updateData(child, keyPath))
  }
  // add a fill to all the uncolored cells
  if (!data.hex) {
    data.style = {
      fill: EXTENDED_DISCRETE_COLOR_RANGE[5],
    }
  }
  data.style = {
    ...data.style,
    fillOpacity: keyPath && !keyPath[data.name] ? 0.2 : 1,
  }

  return data
}

export default asNextJSPage(
  class WorkOrders extends React.Component {
    state = {
      date: moment().format('YYYY-MM-DD'),
      data: null,
      pathValue: false,
      finalValue: 'Hover For Info',
      clicked: false,
    }
    populateData() {
      const { date } = this.state
      axios
      .get('/api/workOrder/meta', { params: { date } })
      .then(res => {
        const data = updateData(res.data)
        this.setState({ data })
      })
      .catch(console.error)
    }
    componentDidMount() {
      this.populateData()
    }
    render() {
      const { clicked, date, data, finalValue, pathValue } = this.state
      return (
        <Layout>
          <Card>
            <CardHeader style={{ position: 'relative' }}>
              {/*relative because card-actions is absolute*/}
              <i className="icon-menu" /> Work Orders for {moment(date).format('MMMM Do')}
              <Input
                type="date"
                value={date}
                onChange={e => {
                  this.setState({ date: e.target.value })
                }}
                className="card-actions mt-0 h-100"
                style={{ width: 200 }}
              />
            </CardHeader>
            <CardBody className="p-0">
              <DownloadButton endpoint="work-orders" color="primary">
                Download Work Orders
              </DownloadButton>
              {data && (
                <Sunburst
                  data={data}
                  width={500}
                  height={500}
                  getSize={d => d.value}
                  getColor={d => d.hex}
                  colorType="literal"
                  hideRootNode
                  onValueMouseOver={node => {
                    if (clicked) {
                      return
                    }
                    const path = getKeyPath(node).reverse()
                    const pathAsMap = path.reduce((res, row) => {
                      res[row] = true
                      return res
                    }, {})
                    this.setState({
                      finalValue: path[path.length - 1],
                      pathValue: ['Work Orders'].concat(path.slice(1)).join(' > '),
                      data: updateData(data, pathAsMap),
                    })
                  }}
                  onValueMouseOut={() =>
                    clicked
                      ? () => {}
                      : this.setState({
                        pathValue: false,
                        finalValue: false,
                        data: updateData(data, false),
                      })
                  }
                >
                  <LabelSeries data={[{ x: 0, y: 0, label: finalValue || 'Hover For Info', style: LABEL_STYLE }]} />
                </Sunburst>
              )}
              {pathValue}
            </CardBody>
          </Card>
        </Layout>
      )
    }
  }
)
