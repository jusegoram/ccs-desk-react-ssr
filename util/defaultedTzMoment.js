import moment from '../node_modules/moment-timezone/index'

if (process.server) moment.tz.setDefault('America/Los_Angeles')

export default moment
