import moment from 'moment-timezone'

export default timezone => {
  const clientMoment = input => moment.tz(input, timezone)
  clientMoment.tz = moment.tz
  clientMoment.utc = moment.utc
  return clientMoment
}
