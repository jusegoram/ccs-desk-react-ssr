//CCS_UNIQUE Y2HYNIOINQ
const Readable = require('stream').Readable

module.exports = str => {
  const stream = new Readable()
  stream.push(str)
  stream.push(null)
  return stream
}
