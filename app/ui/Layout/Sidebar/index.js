import React from 'react'

import Link from 'next/link'
import { Badge, Nav, NavItem, NavLink as RsNavLink } from 'reactstrap'
import classNames from 'classnames'
import { withLocation } from 'app/util/providers'
import nav from '../_nav'
import SidebarFooter from './../SidebarFooter'
import SidebarForm from './../SidebarForm'
import SidebarHeader from './../SidebarHeader'
import SidebarMinimizer from './../SidebarMinimizer'

class Sidebar extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.activeRoute = this.activeRoute.bind(this)
    this.hideMobile = this.hideMobile.bind(this)
  }

  handleClick(e) {
    e.preventDefault()
    e.target.parentElement.classList.toggle('open')
  }

  activeRoute(routeName, props) {
    // return this.props.location.pathname.indexOf(routeName) > -1 ? 'nav-item nav-dropdown open' : 'nav-item nav-dropdown';
    return props.location.pathname.indexOf(routeName) > -1 ? 'nav-item nav-dropdown open' : 'nav-item nav-dropdown'
  }

  hideMobile() {
    if (document.body.classList.contains('sidebar-mobile-show')) {
      document.body.classList.toggle('sidebar-mobile-show')
    }
  }

  // todo Sidebar nav secondLevel
  // secondLevelActive(routeName) {
  //   return this.props.location.pathname.indexOf(routeName) > -1 ? "nav nav-second-level collapse in" : "nav nav-second-level collapse";
  // }

  render() {
    const props = this.props

    // badge addon to NavItem
    const badge = badge => {
      if (badge) {
        const classes = classNames(badge.class)
        return (
          <Badge className={classes} color={badge.variant}>
            {badge.text}
          </Badge>
        )
      }
    }

    // simple wrapper for nav-title item
    const wrapper = item => {
      return item.wrapper && item.wrapper.element
        ? React.createElement(item.wrapper.element, item.wrapper.attributes, item.name)
        : item.name
    }

    // nav list section title
    const title = (title, key) => {
      const classes = classNames('nav-title', title.class)
      return (
        <li key={key} className={classes}>
          {wrapper(title)}{' '}
        </li>
      )
    }

    // nav list divider
    const divider = (divider, key) => {
      const classes = classNames('divider', divider.class)
      return <li key={key} className={classes} />
    }

    // nav label with nav link
    const navLabel = (item, key) => {
      const classes = {
        item: classNames('hidden-cn', item.class),
        link: classNames('nav-label', item.class ? item.class : ''),
      }
      return navLink(item, key, classes)
    }

    // nav item with nav link
    const navItem = (item, key) => {
      const classes = {
        item: classNames(item.class),
        link: classNames('nav-link', item.variant ? `nav-link-${item.variant}` : ''),
      }
      return navLink(item, key, classes)
    }

    // nav link
    const navLink = (item, key, classes) => {
      const url = item.url ? item.url : ''
      return (
        <NavItem key={key} className={classes.item}>
          {isExternal(url) ? (
            <RsNavLink href={url} className={classes.link} active>
              {item.icon && <item.icon size={14} style={{ margin: '0 0.5rem 0 0' }} />}
              {item.name}
              {badge(item.badge)}
            </RsNavLink>
          ) : (
            <Link shallow href={url}>
              <a className={classes.link} onClick={this.hideMobile}>
                {item.icon && <item.icon size={14} style={{ margin: '0 0.5rem 0 0' }} />}
                {item.name}
                {badge(item.badge)}
              </a>
            </Link>
          )}
        </NavItem>
      )
    }

    // nav dropdown
    const navDropdown = (item, key) => {
      return (
        <li key={key} className={this.activeRoute(item.url, props)}>
          <a className="nav-link nav-dropdown-toggle" href="#" onClick={this.handleClick}>
            {item.icon && <item.icon size={14} style={{ margin: '0 0.5rem 0 0' }} />}
            {item.name}
          </a>
          <ul className="nav-dropdown-items">{navList(item.children)}</ul>
        </li>
      )
    }

    // nav type
    const navType = (item, idx) => {
      return item.title
        ? title(item, idx)
        : item.divider
          ? divider(item, idx)
          : item.label
            ? navLabel(item, idx)
            : item.children
              ? navDropdown(item, idx)
              : navItem(item, idx)
    }

    // nav list
    const navList = items => {
      return items.map((item, index) => navType(item, index))
    }

    const isExternal = url => {
      const link = url ? url.substring(0, 4) : ''
      return link === 'http'
    }

    // sidebar-nav root
    return (
      <div className="sidebar">
        <SidebarHeader />
        <SidebarForm />
        <nav className="sidebar-nav">
          <Nav>{navList(nav.items)}</Nav>
        </nav>
        <SidebarFooter />
        <SidebarMinimizer toggleCompression={this.props.toggleCompression} />
      </div>
    )
  }
}

export default withLocation(Sidebar)
