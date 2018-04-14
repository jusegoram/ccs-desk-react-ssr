import _ from 'lodash'

export default class Timer {
  times = {}
  starts = {}
  current = null
  start(name) {
    this.current = name
    this.starts[name] = process.hrtime()
  }
  stop(name) {
    const diff = process.hrtime(this.starts[name])
    this.current = null
    this.times[name] = this.times[name] || 0
    const diffMs = diff[0] * 1000 + diff[1] / 1000000
    this.times[name] += diffMs
  }
  split(name) {
    if (this.current) this.stop(this.current)
    this.start(name)
  }
  toString() {
    const timePairs = _.toPairs(this.times)
    const nameWidth = _.maxBy(timePairs, '0.length')[0].length
    return timePairs
    .map(timePair => {
      const padding = new Array(nameWidth - timePair[0].length + 1).join(' ')
      return timePair[0] + padding + ' | ' + Math.floor(timePair[1]) + ' ms'
    })
    .join('\n')
  }
}
