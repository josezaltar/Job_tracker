import { Router } from 'express'
import authRoutes from './auth'
import jobsRoutes from './jobs'

const router = Router()

router.use('/auth', authRoutes)
router.use('/jobs', jobsRoutes)

export default router
