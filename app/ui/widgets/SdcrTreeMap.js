import React from 'react'
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
      cursor: null,
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
    this.getData(this.props)
  }
  componentWillReceiveProps(newProps) {
    this.getData(newProps)
  }
  async getData(props) {
    const { dateRange, scopeType, scopeName, groupType, showProblems } = props
    const { data } = await axios.get('/api/sdcr', {
      params: { dateRange, scopeType, scopeName, groupType },
    })
    if (showProblems) {
      data.children = data.children.map(el => ({
        ...el,
        value: el.size - el.value,
        color: '#ff0000',
        name:
          el.name
          .split(' ')
          .slice(0, -1)
          .join(' ') + ` (${el.size - el.value})`,
      }))
    }
    this.setState({ treemapData: data })
  }
  _onMouseMove(e) {
    this.setState({ cursor: { x: e.clientX, y: e.clientY } })
  }

  render() {
    const { onClick, size } = this.props
    const { hoveredNode, treemapData, cursor } = this.state
    console.log(treemapData)
    const treeProps = {
      height: (size && size.height) || 500,
      width: (size && size.width) || 800,
      // animation: {
      //   damping: 18,
      //   stiffness: 300,
      // },
      // onLeafMouseOver: x => this.setState({ hoveredNode: x }),
      // onLeafMouseOut: () => this.setState({ hoveredNode: null }),
      // onLeafClick: x => {
      //   this.setState({ hoveredNode: null })
      //   onClick && onClick(x.data)
      // },
      getLabel: x => x.name,
      getColor: x => x.color,
      colorType: 'literal',
      mode: 'binary',
    }
    // const tooltipTransformX = hoveredNode && cursor && cursor.x + 100 > size.width ? '-100%' : '100px'
    // const tooltipTransformY = hoveredNode && cursor && cursor.y + 50 > size.height ? '-100%' : '100px'
    // this.getOverallData()
    return <Treemap data={treemapData} {...treeProps} />
  }
}

export default componentQueries({ queries: [size => ({ size })], config: { monitorHeight: true, monitorWidth: true } })(
  SdcrTreemap
)
