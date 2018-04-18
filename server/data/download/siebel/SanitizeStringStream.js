//CCS_UNIQUE 3CR7SNS166A
const { Transform } = require('stream')

class StringSanitizationTransform extends Transform {
  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString().replace(/[^a-zA-Z0-9.!@?#"$%&:';()*+,/;\-=[\\\]^_{|}<>~` \n\r]/g, ''))
  }
}

module.exports = StringSanitizationTransform
