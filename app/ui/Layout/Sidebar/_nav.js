export default {
  items: [
    {
      title: true,
      name: 'Analytics',
      wrapper: {
        // optional wrapper object
        element: 'span', // required valid HTML5 element tag
        attributes: {}, // optional valid JS object with JS API naming ex: { className: 'my-class', style: { fontFamily: 'Verdana' }, id: 'my-id'}
      },
      class: 'text-center', // optional class names space delimited list for title item ex: 'text-center'
    },
    {
      name: 'SDCR',
      url: '/data/sdcr',
      icon: 'icon-speedometer',
      // badge: {
      //   variant: 'info',
      //   text: 'NEW'
      // }
    },
    {
      title: true,
      name: 'Reports',
      wrapper: {
        // optional wrapper object
        element: 'span', // required valid HTML5 element tag
        attributes: {}, // optional valid JS object with JS API naming ex: { className: 'my-class', style: { fontFamily: 'Verdana' }, id: 'my-id'}
      },
      class: 'text-center', // optional class names space delimited list for title item ex: 'text-center'
    },
    {
      name: 'Routelogs',
      url: '/data/routelogs',
      icon: 'icon-directions',
      // badge: {
      //   variant: 'info',
      //   text: 'NEW'
      // }
    },
    {
      title: true,
      name: 'Work Orders',
      wrapper: {
        element: 'span',
        attributes: {},
      },
      class: 'text-center',
    },
    {
      name: 'Pending',
      url: '/work-orders/pending',
      icon: 'icon-clock',
      // badge: {
      //   variant: 'info',
      //   text: 'NEW'
      // }
    },
    {
      title: true,
      name: 'People',
      wrapper: {
        element: 'span',
        attributes: {},
      },
      class: 'text-center',
    },
    {
      name: 'Techs',
      url: '/techs',
      icon: 'icon-people',
    },
    {
      name: 'Associates',
      url: '/associates',
      icon: 'icon-people',
    },
    {
      divider: true,
      class: 'm-3',
    },
    {
      title: true,
      name: 'System',
      wrapper: {
        element: 'span',
        attributes: {},
      },
      class: 'text-center',
    },
    {
      name: 'System Status',
      url: '/status',
      icon: 'fa fa-circle text-success',
      label: {
        variant: 'success',
      },
    },
  ],
}
