import withGUID from 'objection-guid'

export default ModelClass => withGUID()(ModelClass)
