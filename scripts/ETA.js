import moment from 'moment-timezone'

export default class ETA {
  opsCompleted = 0
  info = {
    elapsed: 0,
    rate: Infinity,
    total: 0,
    percentComplete: 0,
    timeRemaining: 0,
    opsRemaining: 0,
    eta: 0,
  }
  constructor(totalOps) {
    this.totalOps = totalOps
  }
  start() {
    this.initialTime = moment().valueOf()
  }
  markOpComplete() {
    this.opsCompleted++
    const currentTime = moment().valueOf()
    const elapsed = currentTime - this.initialTime
    const rate = elapsed / this.opsCompleted
    const total = parseInt(rate * this.totalOps)
    const percentComplete = this.opsCompleted / this.totalOps
    const timeRemaining = total - elapsed
    const opsRemaining = this.totalOps - this.opsCompleted
    const eta = currentTime + timeRemaining
    this.info = {
      elapsed,
      rate,
      total,
      percentComplete,
      timeRemaining,
      opsRemaining,
      eta,
    }
    console.log(this.info)
  }
}
