// const moment = require('moment')

// const timezoneMap = {
//   'Eastern Time (US & Canada)': 'America/New_York',
//   'Central Time (US & Canada)': 'America/Chicago',
// }

// module.exports = async ({ knex, csv_cid }) => {
//   await knex.transaction(async trx => {
//     const importData = await trx
//     .select()
//     .from('downloaded_csvs')
//     .where({ cid: csv_cid })
//     .first()
//     console.log(importData)
//     const activityNumbersInReport = trx
//     .select('data_key')
//     .from('downloaded_csv_rows')
//     .where({ csv_cid })

//     await trx('daily_activities')
//     .where({
//       date: moment.utc(importData.downloaded_on).format('YYYY-MM-DD'),
//       source: importData.source,
//     })
//     .whereNot({ status: 'Rescheduled' })
//     .whereNotIn('activity_number', activityNumbersInReport)
//     .update({ status: 'Rescheduled' })
//     await trx
//     .select()
//     .from('downloaded_csv_rows')
//     .where({ csv_cid })
//     .map(
//       async row => {
//         const upsertKey = {
//           source: importData.source,
//           date: moment.utc(importData.downloaded_on).format('YYYY-MM-DD'),
//           activity_number: row.data_key,
//         }
//         const existingActivity = await trx
//         .select()
//         .from('daily_activities')
//         .where(upsertKey)
//         .first()
//         const timezone = timezoneMap[row.data['Timezone'].slice(12)]
//         const due_date = row.data['Activity Due Date'] && row.data['Activity Due Date'].slice(0, 10)
//         const update = {
//           company:
//               row.data['Tech Type'] == 'W2'
//                 ? null
//                 : row.data['Tech Type'] == 'DW Direct INC' ? 'DW DIRECT' : row.data['Tech Type'],
//           status: row.data['Status'],
//           data: row.data,
//           due_date,
//           timezone,
//           type: row.data['Order Type'],
//         }
//         if (!existingActivity) {
//           await trx.into('daily_activities').insert({
//             ...upsertKey,
//             ...update,
//           })
//         } else {
//           await trx('daily_activities')
//           .where(upsertKey)
//           .update(update)
//         }
//       },
//       { concurrency: 100 }
//     )
//   })
// }
