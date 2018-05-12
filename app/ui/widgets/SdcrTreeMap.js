import React from 'react'
import ReactDOM from 'react-dom'
import { Treemap } from 'react-vis'
import componentQueries from 'react-component-queries'
import axios from 'axios'

class SdcrTreemap extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hoveredNode: false,
      useCirclePacking: false,
      treemapData: {
        children: [],
      },
      cursor: { x: 0, y: 0 },
    }
  }
  // getOverallData() {
  //   const { treemapData } = this.state
  //   if (treemapData.meta !== undefined) return
  //   treemapData.meta = {
  //     size: 0,
  //     value: 0,
  //   }
  //   treemapData.children.forEach(child => {
  //     treemapData.meta.size += child.size
  //   })
  //   treemapData.children.forEach(child => {
  //     treemapData.meta.value += child.size / treemapData.meta.size * child.value
  //   })
  // }
  componentDidMount() {
    this.domNode = ReactDOM.findDOMNode(this)
    this.getData(this.props)
  }
  componentWillReceiveProps(newProps) {
    this.getData(newProps)
  }
  async getData(props) {
    const { dateRange, scopeType, scopeName, groupType, workOrderType } = props
    const { data } = await axios.get('/api/sdcr', {
      params: { dateRange, scopeType, scopeName, groupType, workOrderType },
    })
    this.setState({ treemapData: data })
  }
  _onMouseMove(e) {
    this.setState({ cursor: { x: e.clientX, y: e.clientY } })
  }
  onLeafMouseOver(x) {
    console.log(x)
    this.setState({ hoveredNode: x })
  }
  render() {
    const { onClick, size } = this.props
    const { hoveredNode, treemapData, cursor } = this.state
    const treeProps = {
      height: (size && size.height) || 500,
      width: (size && size.width) || 800,
      animation: {
        damping: 18,
        stiffness: 300,
      },
      onLeafMouseOver: this.onLeafMouseOver.bind(this),
      // onLeafMouseOut: () => this.setState({ hoveredNode: null }),
      // onLeafClick: x => {
      //   onClick && onClick(x.data)
      // },
      getLabel: x => x.name,
      getColor: x => x.color,
      colorType: 'literal',
      mode: 'binary',
    }

    let hintStyle = {}
    if (this.domNode) {
      const bounds = this.domNode.getBoundingClientRect()
      const left = hoveredNode && hoveredNode.x0 + (hoveredNode.x0 > bounds.width / 2 ? -10 : 10)
      const top = hoveredNode && hoveredNode.y0 + (hoveredNode.y0 > bounds.height / 2 ? -10 : 30)
      const translateX = hoveredNode && cursor && (hoveredNode.x0 > bounds.width / 2 ? '-100%' : 0)
      const translateY = hoveredNode && cursor && (hoveredNode.y0 > bounds.height / 2 ? '-100%' : 0)
      hintStyle = {
        position: 'absolute',
        top: top || 0,
        left: left || 0,
        backgroundColor: '#384042',
        borderRadius: 5,
        color: '#fff',
        padding: 10,
        opacity: 0.8,
        pointerEvents: 'none',
        transform: `translate(${translateX}, ${translateY})`,
      }
    }
    // this.getOverallData()
    return (
      <div style={{ position: 'relative' }}>
        <div>
          <Treemap data={treemapData} {...treeProps} />
        </div>
        {hoveredNode &&
          hoveredNode.data &&
          hoveredNode.data.name && (
          <div style={hintStyle}>
            <strong>{hoveredNode.data.name}</strong>
            <br />Size: {hoveredNode.data.size}
          </div>
        )}
      </div>
    )
  }
}

export default componentQueries({ queries: [size => ({ size })], config: { monitorHeight: true, monitorWidth: true } })(
  SdcrTreemap
)
