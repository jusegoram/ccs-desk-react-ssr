// //CCS_UNIQUE KATR2Y2LNU
// /* eslint-disable no-console */
// const Crontab = require('crontab')
// const Promise = require('bluebird')
// const os = require('os')
// const _ = require('lodash')
// const jobSpecs = require('../../../cronjobs.json')

// Promise.promisifyAll(Crontab)

// const commentPrefix = 'CCS CLI: '
// const commentRegex = new RegExp(`^${commentPrefix}`)

// module.exports = async ({ action }) => {
//   if (action === 'update') {
//     if (os.userInfo().username !== 'root') {
//       console.error('Can only run action `update` as root. Run this as root from an interactive terminal (`sudo -i`).')
//       return
//     }
//     // if (process.env.NODE_ENV !== 'production') {
//     //   console.error("It looks like you're running this in a non-production environment, which isn't advisable.")
//     // return
//     // }
//   }
//   const crontab = await Crontab.loadAsync()
//   Promise.promisifyAll(crontab)
//   try {
//     const oldJobs = crontab.jobs({ comment: commentRegex })
//     if (action === 'update') crontab.remove({ comment: commentRegex })
//     const newJobs = jobSpecs.map(jobSpec => {
//       let logClause = ''
//       if (jobSpec.logName) {
//         logClause = ` > /home/ubuntu/logs/cron/${jobSpec.logName}.log 2>&1`
//       }
//       const command = `. /home/ubuntu/.cron_profile; ${jobSpec.command}${logClause}`
//       const job = crontab.create(command, jobSpec.schedule, commentPrefix + (jobSpec.comment || ''))
//       if (!job) {
//         throw new Error('Unable to create job spec: ' + JSON.stringify(jobSpec, null, '\t'))
//       }
//       return job
//     })
//     if (action === 'update') {
//       console.log('\nOld State: ')
//       oldJobs.forEach(job => console.log(job.toString()))
//     }
//     console.log('\nNew State: ')
//     newJobs.forEach(job => console.log(job.toString()))

//     if (action == 'test') {
//       console.log('\nTEST-MODE: No Changes Saved.')
//     } else if (action == 'update') {
//       const deletedJobs = _.differenceBy(oldJobs, newJobs, job => job.toString())
//       const addedJobs = _.differenceBy(newJobs, oldJobs, job => job.toString())

//       if (deletedJobs.length == 0 && addedJobs.length == 0) {
//         console.log('\nNo changes to save.')
//       } else {
//         console.log('\nDeleted Jobs: ')
//         deletedJobs.forEach(job => console.log(job.toString()))
//         console.log('\nAdded Jobs:')
//         addedJobs.forEach(job => console.log(job.toString()))

//         console.log('\nSaving...')
//         await crontab.saveAsync()
//         console.log('Changes Saved.')
//       }
//     }
//   } catch (e) {
//     console.error('\nERROR!')
//     console.error(e.message)
//   }
// }
