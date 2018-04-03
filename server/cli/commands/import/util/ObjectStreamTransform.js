import { Transform } from 'stream'

export default class ObjectStreamTransform extends Transform {
  constructor(callback) {
    super({ objectMode: true })
    this.callback = callback
  }
  async _transform(data, encoding, next) {
    const newObject = await this.callback(data)
    this.push(newObject)
    next()
  }
}
