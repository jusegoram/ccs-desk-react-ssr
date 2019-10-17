import { Model } from 'objection'
import knex from 'server/knex'
import * as models from 'server/api/models'
import _ from 'lodash'
import express from 'express'

Model.knex(knex)

const router = express.Router()




router.get('/:id/techs', async (req, res) => {
  const {id} = req.params
  const visibleTechIds = knex('workGroupTechs')
  .select('techId')
  .whereIn('workGroupId', id)
  await models.Tech.query().whereIn('id', visibleTechIds).then(result => {
    res.status(200).json(result)
  })
})


router.post('/:id/claim', async (req, res) => {
  const {id} = req.params
  const newOwner = req.body
  const techsToBeClaimed = knex('workGroupTechs')
  .select('techId')
  .whereIn('workGroupId', id)
  const rowTech = knex('workGroupTechs')
  .select('techId')
  .whereIn('workGroupId', newOwner.tempClaimId).limit(1)
  await models.Tech.query().select('row').where('id', rowTech).limit(1)
  .catch(err => {
    res.status(400).json(err)
  })
  .then( async result => {
    if(result.length === 1){
      const {row} = JSON.parse(JSON.stringify(result[0]))
      await models.Tech.query().update({
        tempClaimTeamId: newOwner.tempClaimTeamId,
        tempClaimTeamName: newOwner.tempClaimTeamName,
        tempClaimTeamPhone: row['Tech Team Supervisor Mobile #'],
        tempClaimFromDate: newOwner.tempClaimFromDate,
        tempClaimToDate:newOwner.tempClaimToDate,
      }).whereIn('id', techsToBeClaimed).then( async finalResult => {
          res.status(200).json(finalResult)
      })
    }else {
      res.status(400).json({message: 'Sometimes our system has empty duplicates, use another team record with the same name'})
    }
  })
})

export default router