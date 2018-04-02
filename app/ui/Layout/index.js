import React from 'react'

import { Container } from 'reactstrap'

import Header from 'app/ui/Layout/Header'
import Aside from 'app/ui/Layout/Aside'
import Sidebar from 'app/ui/Layout/Sidebar'

class Layout extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      sidebarIsOpen: true,
      sidebarIsCompressed: false,
      asideIsOpen: false,
    }
    this.toggleSidebar = this.toggleSidebar.bind(this)
    this.toggleAside = this.toggleAside.bind(this)
    this.toggleSidebarCompression = this.toggleSidebarCompression.bind(this)
  }

  toggleSidebar() {
    this.setState({ sidebarIsOpen: !this.state.sidebarIsOpen })
  }
  toggleSidebarCompression() {
    this.setState({ sidebarIsCompressed: !this.state.sidebarIsCompressed })
  }
  toggleAside() {
    this.setState({ asideIsOpen: !this.state.asideIsOpen })
  }
  render() {
    const { sidebarIsOpen, asideIsOpen, sidebarIsCompressed } = this.state
    const { session, location, style, children } = this.props
    const mainStyle = {
      marginTop: 20,
      marginBottom: 20,
      ...style,
    }
    const extraClasses = [
      sidebarIsOpen ? '' : 'sidebar-hidden',
      !sidebarIsCompressed ? '' : 'sidebar-minimized brand-minimized',
      asideIsOpen ? '' : 'aside-menu-hidden',
    ]

    const className = `app header-fixed sidebar-fixed aside-menu-fixed ${extraClasses.join(' ')}`
    return (
      <div className={className}>
        <Header session={session} toggleSidebar={this.toggleSidebar} toggleAside={this.toggleAside} />
        <div className="app-body w-100">
          <Sidebar location={location} toggleCompression={this.toggleSidebarCompression} />
          <main className="main">
            {/* <Breadcrumb /> */}
            <Container style={mainStyle} fluid>
              {children}
            </Container>
          </main>
          <Aside isOpen={this.state.asideIsOpen} />
        </div>
      </div>
    )
  }
}

export default Layout
