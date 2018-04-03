// //CCS_UNIQUE S48THZF76G
// const Promise = require('bluebird')
// const parseFullName = require('parse-full-name').parseFullName
// const Hash = require('../../../../util/Hash')
// const _ = require('lodash')

// const getTechPropsFromCsvRow = ({ knex, source, row }) => {
//   const name = parseFullName(row.data['Tech Full Name'])
//   const phone_number = row.data['Tech Mobile Phone #']
//   const company =
//     row.data['Tech Type'] == 'W2'
//       ? source
//       : row.data['Tech Type'] === 'DW Direct INC' ? 'DW DIRECT' : row.data['Tech Type']
//   const { DMA: dma, Office: office, 'Service Region': serviceRegion, 'Tech Team ID': team } = row.data
//   const group_names = {
//     DMA: dma,
//     Office: office,
//     'Service Region': serviceRegion,
//     Team: team,
//   }
//   const {
//     'Skill Package': skills,
//     'Tech Schedule': schedule,
//     'Start Latitude': startLatInt,
//     'Start Longitude': startLongInt,
//     'Max Travel Miles': coverageRadiusMiles,
//   } = row.data
//   const start_location = knex.raw('ST_MakePoint(?, ?)::geography', [startLongInt / 1000000, startLatInt / 1000000])
//   const coverage_radius = coverageRadiusMiles * 1609.34
//   const filteredGroups = _.pickBy(group_names, _.identity) //remove falsy props
//   const groups = _.values(_.mapValues(filteredGroups, (groupName, groupType) => Hash.group({ groupType, groupName })))
//   return _.mapValues(
//     {
//       cid: Hash.tech({ company, techId: row.data['Tech User ID'] }),
//       source,
//       company,
//       tech_id: row.data['Tech User ID'],
//       first_name: name.first,
//       last_name: name.last,
//       phone_number,
//       supervisor_phone: row.data['Tech Team Supervisor Mobile #'],
//       supervisor: row.data['Team Name'],
//       group_names,
//       groups: JSON.stringify(groups),
//       skills,
//       schedule,
//       start_location,
//       coverage_radius,
//       data: row.data,
//     },
//     val => (!val ? null : val)
//   )
// }

// module.exports = async ({ knex, source, csv_cid }) => {
//   await knex.transaction(async trx => {
//     // delete old tech profiles from this source
//     await trx('tech_profiles')
//     .where({ source })
//     .delete()

//     // replace deleted tech profiles with new ones
//     const csvRowsWithDupes = await trx
//     .select()
//     .from('downloaded_csv_rows')
//     .where({ csv_cid })
//     .map(async row => {
//       const company = row.data['Tech Type'] == 'W2' ? source : row.data['Tech Type']
//       return {
//         cid: Hash.tech({ company, techId: row.data_key }),
//         source,
//         data: row.data,
//       }
//     })
//     const csvRows = _.uniqBy(csvRowsWithDupes, 'cid')
//     await knex.batchInsert('tech_profiles', csvRows, 400).transacting(trx)

//     // determine which techs were in this report
//     const techIdsInReport = trx
//     .select('data_key')
//     .from('downloaded_csv_rows')
//     .where({ csv_cid })
//     // delete techs from this source that weren't in this report
//     await trx('techs')
//     .where({ source })
//     .whereNotIn('tech_id', techIdsInReport)
//     .delete()
//     // upsert techs that were in the report
//     await Promise.resolve(csvRows).mapSeries(async row => {
//       const techProps = getTechPropsFromCsvRow({ knex, source, row })
//       const existingTech = await trx
//       .select()
//       .from('techs')
//       .where({ cid: techProps.cid })
//       .first()
//       if (!existingTech) {
//         await trx.into('techs').insert(techProps)
//       } else {
//         await trx('techs')
//         .where({ cid: techProps.cid })
//         .update(techProps)
//       }
//     })
//   })
// }
