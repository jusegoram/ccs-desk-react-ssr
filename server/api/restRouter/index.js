import express from 'express'

import imageRouter from './image'
import sdcrRouter from './sdcr'
import workGroupRouter from './workGroup'

const router = express.Router()

router.use('/image', imageRouter)
router.use('/sdcr', sdcrRouter)
router.use('/workGroup', workGroupRouter)

export default router
