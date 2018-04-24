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
      name: 'Data',
      wrapper: {
        element: 'span',
      },
      class: 'text-center',
    },
    {
      name: 'Work Order Data',
      url: '/data/work-orders',
      icon: 'fa fa-tasks',
    },
    // {
    //   name: 'Tech Data',
    //   url: '/data/techs',
    //   icon: 'fa fa-users',
    // },
  ],
}
