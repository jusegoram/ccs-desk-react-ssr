import _ from 'lodash'
import { streamToArray } from 'server/util'
import sanitizeCompanyName from 'server/cli/commands/import/processors/sanitizeCompanyName'
import processTechProfile from './processTechProfile'

/* Sample Row Data:
  // { Region: 'AREA01',
  //   DMA: 'HOUSTON TX 1',
  //   Office: 'HOUSTON CENTRAL',
  //   'Service Region': 'TX05',
  //   'Tech Team Supervisor Login': 'MBTX033910',
  //   'Team ID': 'MB000661',
  //   'Team Name': 'JUSTIN JOHNSON',
  //   'Team Email': 'JJOHNSON@goodmannetworks.com',
  //   'Tech User ID': 'MBTX053759',
  //   'Tech ATT UID': 'MC170S',
  //   'Tech Full Name': 'CANDIA, MIGUEL',
  //   'Tech Type': 'Goodman',
  //   'Tech Team Supervisor Mobile #': '8325974061',
  //   'Tech Mobile Phone #': '8325645155',
  //   'Tech Schedule': 'WG 8-6 S Th off',
  //   'Tech Efficiency': '1.2',
  //   'Skill Package': 'INSTALL UPGRADE SERVICE - COMM MDU WB NC ROLLBACK FW',
  //   'Max Travel Miles': '15',
  //   'Start State': 'TX',
  //   'Start City': 'CLEVELAND',
  //   'Start Street': '188 COUNTY RD 2800',
  //   'Start Zip': '77327',
  //   'Start Latitude': '30315160',
  //   'Start Longitude': '-94937570',
  //   'End of Day State': '',
  //   'End of Day City': '',
  //   'End of Day Street': '',
  //   'End of Day Zip': '',
  //   'End of Day Latitude': '0',
  //   'End of Day Longitude': '0' }
*/

export default async ({ csvObjStream, dataSource, w2Company }) => {
  const datas = await streamToArray(csvObjStream, data => {
    data = _.mapKeys(data, (value, key) => key.replace(/[^a-zA-Z0-9#\s]/, ''))
    data = _.mapValues(data, val => (!val || val === 'UNKNOWN' ? null : val))
    if (data['Tech Type'] === 'W2' || !data['Tech Type']) data['Tech Type'] = w2Company.name
    data['Tech Type'] = sanitizeCompanyName(data['Tech Type'])
    data.Company = data['Tech Type']
    data.Team = data['Team ID']
    data.Tech = data['Tech User ID']
    return data
  })

  processTechProfile({ datas, dataSource, w2Company })
}
