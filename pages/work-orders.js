import React from 'react'
import { Card, CardHeader, CardBody, Input } from 'reactstrap'
import moment from 'moment-timezone'
import { Sunburst, LabelSeries, Hint } from 'react-vis'

import DownloadButton from 'app/ui/widgets/DownloadButton'
import Layout from 'app/ui/Layout'
import axios from 'axios'
import _ from 'lodash'

const LABEL_STYLE = {
  fontSize: '16px',
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

const tipStyle = {
  display: 'flex',
  color: '#fff',
  background: '#000',
  alignItems: 'center',
  padding: '5px',
}
const boxStyle = { height: '10px', width: '10px' }

function buildValue(hoveredCell) {
  const { radius, angle, angle0 } = hoveredCell
  const truedAngle = (angle + angle0) / 2
  return {
    x: radius * Math.cos(truedAngle),
    y: radius * Math.sin(truedAngle),
    cell: hoveredCell,
  }
}

function formatValue(path) {
  return hintInfo => {
    const cell = hintInfo.cell
    const parent = cell.parent
    let percent = null
    if (cell.depth === 1) {
      percent = (cell.angle - cell.angle0) / (2 * Math.PI)
    } else {
      const value = cell.children ? _.sumBy(cell.children, 'value') : cell.value
      const parentValue = parent.children ? _.sumBy(parent.children, 'value') : parent.value
      percent = value / parentValue
    }
    return [
      {
        title: path,
        value: (100 * percent).toFixed(2) + '%',
      },
    ]
  }
}

class WorkOrderDonutChart extends React.Component {
  state = {
    pathValue: false,
    finalValue: 'Hover For Info',
    clicked: false,
    size: null,
    hoveredCell: false,
  }
  componentDidUpdate() {
    const height = this.divElement.clientHeight
    const width = this.divElement.clientWidth
    const size = Math.min(height, width)
    if (!this.state.size && size) this.setState({ size })
  }
  render() {
    const { clicked, finalValue, pathValue, size, hoveredCell } = this.state
    const { data } = this.props
    return (
      <div
        style={{
          display: 'flex',
          flex: '1 1 auto',
          alignItems: 'center',
          flexDirection: 'column',
          width: '100%',
        }}
        ref={divElement => (this.divElement = divElement)}
      >
        {data && (
          <Sunburst
            data={data}
            width={size || 500}
            height={size || 500}
            getSize={d => d.value}
            getColor={d => d.hex}
            colorType="literal"
            hideRootNode
            animation={{
              damping: 18,
              stiffness: 300,
            }}
            onValueMouseOver={node => {
              this.setState({ hoveredCell: node })
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
                pathValue: path.slice(1).join(' > '),
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
                  hoveredCell: false,
                })
            }
          >
            {hoveredCell ? <Hint value={buildValue(hoveredCell)} format={formatValue(pathValue)} /> : null}
            <LabelSeries data={[{ x: 0, y: 0, label: finalValue || 'Hover For Info', style: LABEL_STYLE }]} />
          </Sunburst>
        )}
      </div>
    )
  }
}

export default class WorkOrders extends React.Component {
  state = {
    date: moment().format('YYYY-MM-DD'),
    data: null,
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
  componentDidUpdate(prevProps, prevState) {
    if (prevState.date !== this.state.date) this.populateData()
  }
  componentDidMount() {
    this.populateData()
  }
  render() {
    const { date, data } = this.state
    return (
      <Layout>
        <Card style={{ height: 'calc(100vh - 100px)' }}>
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
              style={{ width: 160, display: 'inline-block' }}
            />
            <DownloadButton
              endpoint="work-orders"
              params={{ date }}
              color="primary"
              className="card-actions mt-0 h-100"
              style={{ display: 'inline-block', position: 'absolute', right: 160, top: 0 }}
            >
              Download Work Orders
            </DownloadButton>
          </CardHeader>
          <CardBody
            className="p-0"
            style={{ display: 'flex', flex: '1 0 auto', alignItems: 'center', width: '100%', flexDirection: 'column' }}
          >
            <WorkOrderDonutChart data={data} />
          </CardBody>
        </Card>
      </Layout>
    )
  }
}
