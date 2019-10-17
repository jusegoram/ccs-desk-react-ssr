import express from 'express'

import image from './image'
import sdcr from './sdcr'
import workGroup from './workGroup'
import workOrder from './workOrder'
import tech from './tech'
import team from './team'
const router = express.Router()
router.use('/tech', tech)
router.use('/team', team)
router.use('/image', image)
router.use('/sdcr', sdcr)
router.use('/workGroup', workGroup)
router.use('/workOrder', workOrder)

export default router
