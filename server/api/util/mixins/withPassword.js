import withPassword from 'objection-password'

export default options => ModelClass => withPassword(options)(ModelClass)
