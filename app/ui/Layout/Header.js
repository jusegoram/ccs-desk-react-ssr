import React, { Component } from 'react'
import { Nav, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap'
import HeaderDropdown from './HeaderDropdown'
import nav from './_nav'
import _ from 'lodash'
import { withLocation } from 'app/util/providers'

class Header extends Component {
  constructor(props) {
    super(props)
    this.sidebarToggle = this.sidebarToggle.bind(this)
    this.asideToggle = this.asideToggle.bind(this)
  }

  sidebarToggle() {
    this.props.toggleSidebar()
  }

  sidebarMinimize(e) {
    e.preventDefault()
    document.body.classList.toggle('sidebar-minimized')
  }

  mobileSidebarToggle(e) {
    e.preventDefault()
    document.body.classList.toggle('sidebar-mobile-show')
  }

  asideToggle() {
    this.props.toggleAside()
  }

  render() {
    const brandStyle = {
      color: '#fff',
      letterSpacing: '3px',
      fontSize: '21px',
      lineHeight: '60px',
      padding: 0,
      textAlign: 'center',
      textTransform: 'uppercase',
    }
    const titleStyle = {
      letterSpacing: '1px',
      fontSize: '21px',
      lineHeight: '60px',
      padding: 0,
      textAlign: 'center',
    }
    const title = this.props.title
    return (
      <header className="app-header navbar">
        <NavbarToggler className="d-lg-none" onClick={this.mobileSidebarToggle}>
          <span className="navbar-toggler-icon" />
        </NavbarToggler>
        <NavbarBrand href="#" style={brandStyle}>
          CCS Desk
        </NavbarBrand>
        <NavbarToggler className="d-md-down-none h-100 b-r-1 px-3" onClick={this.sidebarToggle}>
          <span className="navbar-toggler-icon" />
        </NavbarToggler>
        {/* <Nav className="d-md-down-none" navbar>
          <NavItem className="px-3">
            <NavLink href="#">Dashboard</NavLink>
          </NavItem>
          <NavItem className="px-3">
            <NavLink href="#">Users</NavLink>
          </NavItem>
          <NavItem className="px-3">
            <NavLink href="#">Settings</NavLink>
          </NavItem>
        </Nav> */}
        <Nav className="ml-auto mr-auto" navbar style={titleStyle}>
          {title}
        </Nav>
        <Nav className="mx-1" navbar>
          {/* <HeaderDropdown notif />
          <HeaderDropdown tasks />
          <HeaderDropdown mssgs /> */}
          <HeaderDropdown accnt session={this.props.session} />
        </Nav>
        {/* <NavbarToggler className="d-md-down-none" onClick={this.asideToggle}>
          <span className="navbar-toggler-icon" />
        </NavbarToggler> */}
      </header>
    )
  }
}

export default withLocation(Header)
