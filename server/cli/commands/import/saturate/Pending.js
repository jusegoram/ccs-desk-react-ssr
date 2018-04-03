// //CCS_UNIQUE S48THZF76G

// const fromCsvToLatLong = (lat, long) => {
//   return (lat && long && [lat, long].map(d => parseInt(d) / 1000000)) || [null, null]
// }
// module.exports = async ({ knex, csv_cid }) => {
//   await knex.transaction(async trx => {
//     const importData = await trx
//     .select()
//     .from('downloaded_csvs')
//     .where({ cid: csv_cid })
//     .first()

//     await trx('pending_jobs')
//     .where({ source: importData.source })
//     .delete()
//     await knex
//     .select()
//     .from('downloaded_csv_rows')
//     .where({ csv_cid })
//     .map(row => ({
//       source: importData.source,
//       data: row.data,
//       location: knex.raw(
//         'ST_MakePoint(?, ?)::geography',
//         fromCsvToLatLong(row.data['Activity Geo Longitude'], row.data['Activity Geo Latitude'])
//       ),
//     }))
//     .then(pending_jobs_rows => knex.batchInsert('pending_jobs', pending_jobs_rows, 1000).transacting(trx))
//   })
// }
