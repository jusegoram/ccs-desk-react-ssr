import express from 'express'

import image from './image'
import sdcr from './sdcr'
import workGroup from './workGroup'
import workOrder from './workOrder'

const router = express.Router()

router.use('/image', image)
router.use('/sdcr', sdcr)
router.use('/workGroup', workGroup)
router.use('/workOrder', workOrder)

export default router
