import moment from 'moment-timezone'
import Eta from './ETA'

var eta = new Eta(10 * 60)

const outputEtaInfo = () => {
  const info = eta.info
  console.log(`ETA Data:
  Reports completed: ${eta.opsCompleted}
  Reports remaining: ${info.opsRemaining}
  Percent complete: ${(100 * info.percentComplete).toFixed(1)}%
  Time taken so far: ${moment.duration(info.elapsed).humanize()} (${info.elapsed}ms)
  Time taken per report: ${moment.duration(info.rate).humanize()} (${info.rate}ms)
  Estimated total time: ${moment.duration(info.total).humanize()} (${info.total}ms)
  Estimated time remaining: ${moment.duration(info.timeRemaining).humanize()} (${info.timeRemaining}ms)
  Estimated ETA: ${moment(info.eta).format('LLLL')}
`)
}

function iterate() {
  eta.markOpComplete()
  outputEtaInfo()
  setTimeout(iterate, 500 + Math.ceil(Math.random() * 1000))
}

eta.start()
iterate()
