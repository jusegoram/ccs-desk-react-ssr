import React, { Component } from 'react'
import { Badge, DropdownItem, DropdownMenu, DropdownToggle, Dropdown, Progress } from 'reactstrap'
import { compose, withApollo, graphql } from 'react-apollo'
import { get as p } from 'lodash'
import Link from 'next/link'
import cookie from 'cookie'

import data from 'app/apollo/data'
import { withSession } from 'app/util/providers'

class HeaderDropdown extends Component {
  constructor(props) {
    super(props)

    this.toggle = this.toggle.bind(this)
    this.logout = this.logout.bind(this)
    this.state = {
      dropdownOpen: false,
    }
  }

  async logout() {
    document.cookie = cookie.serialize('token', '', { maxAge: -1 })
    this.props.client.cache.reset().then(() => {
      setTimeout(() => {
        window.location = '/'
      }, 2000)
    })
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen,
    })
  }

  dropNotif() {
    const itemsCount = 5
    return (
      <Dropdown nav className="d-md-down-none" isOpen={this.state.dropdownOpen} toggle={this.toggle}>
        <DropdownToggle nav className="nav-pill">
          <i className="icon-bell" />
          <Badge pill color="danger">
            {itemsCount}
          </Badge>
        </DropdownToggle>
        <DropdownMenu right className="dropdown-menu-lg">
          <DropdownItem header tag="div" className="text-center">
            <strong>You have {itemsCount} notifications</strong>
          </DropdownItem>
          <DropdownItem>
            <i className="icon-user-follow text-success" /> New user registered
          </DropdownItem>
          <DropdownItem>
            <i className="icon-user-unfollow text-danger" /> User deleted
          </DropdownItem>
          <DropdownItem>
            <i className="icon-chart text-info" /> Sales report is ready
          </DropdownItem>
          <DropdownItem>
            <i className="icon-basket-loaded text-primary" /> New client
          </DropdownItem>
          <DropdownItem>
            <i className="icon-speedometer text-warning" /> Server overloaded
          </DropdownItem>
          <DropdownItem header tag="div" className="text-center">
            <strong>Server</strong>
          </DropdownItem>
          <DropdownItem>
            <div className="text-uppercase mb-1">
              <small>
                <b>CPU Usage</b>
              </small>
            </div>
            <Progress className="progress-xs" color="info" value="25" />
            <small className="text-muted">348 Processes. 1/4 Cores.</small>
          </DropdownItem>
          <DropdownItem>
            <div className="text-uppercase mb-1">
              <small>
                <b>Memory Usage</b>
              </small>
            </div>
            <Progress className="progress-xs" color="warning" value={70} />
            <small className="text-muted">11444GB/16384MB</small>
          </DropdownItem>
          <DropdownItem>
            <div className="text-uppercase mb-1">
              <small>
                <b>SSD 1 Usage</b>
              </small>
            </div>
            <Progress className="progress-xs" color="danger" value={90} />
            <small className="text-muted">243GB/256GB</small>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    )
  }

  dropAccnt() {
    const props = this.props
    return (
      <Dropdown nav isOpen={this.state.dropdownOpen} toggle={this.toggle}>
        <DropdownToggle nav className="nav-pill avatar" style={{ lineHeight: '40px' }}>
          <i className="icon-user" style={{ fontSize: 20 }} />
          {/* <Badge pill color="danger">
            9
          </Badge> */}
        </DropdownToggle>
        <DropdownMenu right>
          {/* 
          <DropdownItem>
            <i className="fa fa-bell-o" /> Updates<Badge color="info">42</Badge>
          </DropdownItem>
          <DropdownItem>
            <i className="fa fa-envelope-o" /> Messages<Badge color="success">42</Badge>
          </DropdownItem>
          <DropdownItem>
            <i className="fa fa-tasks" /> Tasks<Badge color="danger">42</Badge>
          </DropdownItem>
          <DropdownItem>
            <i className="fa fa-comments" /> Comments<Badge color="warning">42</Badge>
          </DropdownItem>
          <DropdownItem header tag="div" className="text-center">
            <strong>Settings</strong>
          </DropdownItem>
          <DropdownItem>
            <i className="fa fa-wrench" /> Settings
          </DropdownItem>
          <DropdownItem>
            <i className="fa fa-usd" /> Payments<Badge color="secondary">42</Badge>
          </DropdownItem>
          <DropdownItem>
            <i className="fa fa-file" /> Projects<Badge color="primary">42</Badge>
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem>
            <i className="fa fa-shield" /> Lock Account
          </DropdownItem> */}
          <DropdownItem header tag="div" className="text-center">
            <strong>{`${p(props, 'session.account.name') || ''}`}</strong>
          </DropdownItem>
          {/* <DropdownItem>
            <i className="fa fa-user" /> Account
          </DropdownItem>
          <Link href="/invites/create">
            <DropdownItem>
              <i className="fa icon-envelope-letter" /> Send Invite
            </DropdownItem>
          </Link>
          <Link href="/invites">
            <DropdownItem>
              <i className="fa icon-book-open" /> View Invites
            </DropdownItem>
          </Link> */}
          {p(props, 'session.rootAccount') && (
            <Link shallow href="/root/mimic">
              <DropdownItem onClick={() => this.logout(p(props, 'session.id'))}>
                <i className="fa fa-user-secret" style={{ fontSize: 18 }} /> Mimic User
              </DropdownItem>
            </Link>
          )}
          <DropdownItem onClick={() => this.logout(p(props, 'session.id'))}>
            <i className="fa fa-lock" style={{ fontSize: 18 }} /> Logout
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    )
  }

  dropTasks() {
    const itemsCount = 15
    return (
      <Dropdown nav className="d-md-down-none" isOpen={this.state.dropdownOpen} toggle={this.toggle}>
        <DropdownToggle nav className="nav-pill">
          <i className="icon-list" />
          <Badge pill color="warning">
            {itemsCount}
          </Badge>
        </DropdownToggle>
        <DropdownMenu right className="dropdown-menu-lg">
          <DropdownItem header tag="div" className="text-center">
            <strong>You have {itemsCount} pending tasks</strong>
          </DropdownItem>
          <DropdownItem>
            <div className="small mb-1">
              Upgrade NPM &amp; Bower{' '}
              <span className="float-right">
                <strong>0%</strong>
              </span>
            </div>
            <Progress className="progress-xs" color="info" value={0} />
          </DropdownItem>
          <DropdownItem>
            <div className="small mb-1">
              ReactJS Version{' '}
              <span className="float-right">
                <strong>25%</strong>
              </span>
            </div>
            <Progress className="progress-xs" color="danger" value={25} />
          </DropdownItem>
          <DropdownItem>
            <div className="small mb-1">
              VueJS Version{' '}
              <span className="float-right">
                <strong>50%</strong>
              </span>
            </div>
            <Progress className="progress-xs" color="warning" value={50} />
          </DropdownItem>
          <DropdownItem>
            <div className="small mb-1">
              Add new layouts{' '}
              <span className="float-right">
                <strong>75%</strong>
              </span>
            </div>
            <Progress className="progress-xs" color="info" value={75} />
          </DropdownItem>
          <DropdownItem>
            <div className="small mb-1">
              Angular 2 Cli Version{' '}
              <span className="float-right">
                <strong>100%</strong>
              </span>
            </div>
            <Progress className="progress-xs" color="success" value={100} />
          </DropdownItem>
          <DropdownItem className="text-center">
            <strong>View all tasks</strong>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    )
  }

  dropMssgs() {
    const itemsCount = 7
    return (
      <Dropdown nav className="d-md-down-none" isOpen={this.state.dropdownOpen} toggle={this.toggle}>
        <DropdownToggle nav className="nav-pill">
          <i className="icon-envelope-letter" />
          <Badge pill color="info">
            {itemsCount}
          </Badge>
        </DropdownToggle>
        <DropdownMenu right className="dropdown-menu-lg">
          <DropdownItem header tag="div">
            <strong>You have {itemsCount} messages</strong>
          </DropdownItem>
          <DropdownItem href="#">
            <div className="message">
              <div className="py-3 mr-3 float-left">
                <div className="avatar">
                  <img className="img-avatar" />
                  <Badge className="avatar-status" color="success" />
                </div>
              </div>
              <div>
                <small className="text-muted">John Doe</small>
                <small className="text-muted float-right mt-1">Just now</small>
              </div>
              <div className="text-truncate font-weight-bold">
                <span className="fa fa-exclamation text-danger" /> Important message
              </div>
              <div className="small text-muted text-truncate">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt...
              </div>
            </div>
          </DropdownItem>
          <DropdownItem href="#">
            <div className="message">
              <div className="py-3 mr-3 float-left">
                <div className="avatar">
                  <img className="img-avatar" />
                  <Badge className="avatar-status" color="warning" />
                </div>
              </div>
              <div>
                <small className="text-muted">Jane Doe</small>
                <small className="text-muted float-right mt-1">5 minutes ago</small>
              </div>
              <div className="text-truncate font-weight-bold">Lorem ipsum dolor sit amet</div>
              <div className="small text-muted text-truncate">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt...
              </div>
            </div>
          </DropdownItem>
          <DropdownItem href="#">
            <div className="message">
              <div className="py-3 mr-3 float-left">
                <div className="avatar">
                  <img className="img-avatar" />
                  <Badge className="avatar-status" color="danger" />
                </div>
              </div>
              <div>
                <small className="text-muted">Janet Doe</small>
                <small className="text-muted float-right mt-1">1:52 PM</small>
              </div>
              <div className="text-truncate font-weight-bold">Lorem ipsum dolor sit amet</div>
              <div className="small text-muted text-truncate">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt...
              </div>
            </div>
          </DropdownItem>
          <DropdownItem href="#">
            <div className="message">
              <div className="py-3 mr-3 float-left">
                <div className="avatar">
                  <img className="img-avatar" />
                  <Badge className="avatar-status" color="info" />
                </div>
              </div>
              <div>
                <small className="text-muted">Joe Doe</small>
                <small className="text-muted float-right mt-1">4:03 AM</small>
              </div>
              <div className="text-truncate font-weight-bold">Lorem ipsum dolor sit amet</div>
              <div className="small text-muted text-truncate">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt...
              </div>
            </div>
          </DropdownItem>
          <DropdownItem href="#" className="text-center">
            <strong>View all messages</strong>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    )
  }

  render() {
    const { notif, accnt, tasks, mssgs } = this.props
    return notif
      ? this.dropNotif()
      : accnt
        ? this.dropAccnt()
        : tasks
          ? this.dropTasks()
          : mssgs
            ? this.dropMssgs()
            : null
  }
}

const Session_logout = graphql(data.Session.logout.mutation)

export default compose(withApollo, withSession, Session_logout)(HeaderDropdown)
