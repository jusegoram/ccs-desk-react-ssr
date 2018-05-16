import _ from 'lodash'

import * as models from 'server/api/models'

const { WorkGroup } = models
let srData = null
const workGroupCache = {}

export default async ({ trx, tech, row }) => {
  if (!srData) {
    srData = _.keyBy(
      await trx('directv_sr_data').select('Service Region', 'Office', 'DMA', 'Division'),
      'Service Region'
    )
  }

  const techWorkGroups = _.filter(tech.workGroups, workGroup =>
    _.includes(['Company', 'Subcontractor', 'Team', 'Tech'], workGroup.type)
  )

  const srWorkGroupNames = srData[row['Service Region']]
  const companies = [tech.hsp]
  if (tech.subcontractor) companies.push(tech.subcontractor)
  const srWorkGroups = await Promise.all(
    _.flatten(
      companies.map(company => [
        WorkGroup.query(trx).ensure(
          {
            companyId: company.id,
            type: 'Division',
            externalId: srWorkGroupNames['Division'],
            name: srWorkGroupNames['Division'],
          },
          workGroupCache
        ),
        WorkGroup.query(trx).ensure(
          {
            companyId: company.id,
            type: 'DMA',
            externalId: srWorkGroupNames['DMA'],
            name: srWorkGroupNames['DMA'],
          },
          workGroupCache
        ),
        WorkGroup.query(trx).ensure(
          {
            companyId: company.id,
            type: 'Service Region',
            externalId: srWorkGroupNames['Service Region'],
            name: srWorkGroupNames['Service Region'],
          },
          workGroupCache
        ),
        WorkGroup.query(trx).ensure(
          {
            companyId: company.id,
            type: 'Office',
            externalId: srWorkGroupNames['Office'],
            name: srWorkGroupNames['Office'],
          },
          workGroupCache
        ),
      ])
    )
  )

  return techWorkGroups.concat(srWorkGroups)
}
