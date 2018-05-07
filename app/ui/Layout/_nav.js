import React from 'react'
import * as Icons from 'react-feather'

export default {
  items: [
    // {
    //   title: true,
    //   name: 'Organization',
    //   wrapper: {
    //     // optional wrapper object
    //     element: 'span', // required valid HTML5 element tag
    //     attributes: {}, // optional valid JS object with JS API naming ex: { className: 'my-class' }
    //   },
    //   class: 'text-center', // optional class names space delimited list for title item ex: 'text-center'
    // },
    // {
    //   name: 'Techs',
    //   url: '/organization/techs',
    //   icon: 'fa fa-users',
    // },
    {
      title: true,
      name: 'Analytics',
      wrapper: {
        element: 'span',
      },
      class: 'text-center',
    },
    {
      name: 'SDCR',
      url: '/sdcr',
      icon: Icons.Activity,
    },
    {
      title: true,
      name: 'Data Import Logs',
      wrapper: {
        element: 'span',
      },
      class: 'text-center',
    },
    {
      name: 'Tech Data',
      url: '/data/techs',
      icon: Icons.Users,
    },
    {
      name: 'Work Order Data',
      url: '/data/work-orders',
      icon: Icons.Clipboard,
    },
  ],
}
