import express from 'express'

import techsRouter from './techs'
import workOrdersRouter from './workOrders'

const router = express.Router()

router.use('/techs', techsRouter)
router.use('/work-orders', workOrdersRouter)

export default router
