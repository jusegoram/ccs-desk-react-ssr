//CCS_UNIQUE LQ96X8ZH5N
const { Duplex } = require('stream')

class KnexBatchInsertStream extends Duplex {
  constructor({ trx, table, returnCols = '*', batchSize = 4000 }) {
    super({ objectMode: true, highWaterMark: batchSize })
    this.trx = trx
    this.table = table
    this.returnCols = returnCols
    this.batchSize = batchSize

    this.isCorked = false
    this.writeQueue = []

    this.on('finish', () => {
      this.writableFinished = true
    })
  }
  _write(chunk, encoding, callback) {
    this.writeQueue.push(chunk)
    if (!this.isCorked && this.writeQueue.length >= this.batchSize) {
      this.cork()
      this.isCorked = true
    }
    callback(null)
  }
  async _read(size) {
    const batch = this.writeQueue.splice(0, size)
    if (this.isCorked && this.writeQueue.length < this.batchSize) {
      this.uncork()
      this.isCorked = false
    }
    const results = await this.trx
    .batchInsert(this.table, batch)
    .returning(this.returnCols)
    .transacting(this.trx)
    this.pause()
    while (results.length && this.push(results.shift()));
    this.resume()
    if (this.writableFinished && !this.writeQueue.length) {
      this.push(null)
      return
    }
  }
}

module.exports = KnexBatchInsertStream
