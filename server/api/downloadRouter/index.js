import express from 'express'

import techsRouter from './techs'
import workOrdersRouter from './workOrders'
import sdcr from './sdcr'
import techDashReport from './techDashReport'
const router = express.Router()

router.use('/techs', techsRouter)
router.use('/work-orders', workOrdersRouter)
router.use('/sdcr', sdcr)
router.use('/techDashReport', techDashReport)

export default router
