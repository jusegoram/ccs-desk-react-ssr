import express from 'express'

import imageRouter from './image'
import sdcrRouter from './sdcr'

const router = express.Router()

router.use('/image', imageRouter)
router.use('/sdcr', sdcrRouter)

export default router
