import { Router } from 'express'
import { register, login, getMe, extensionToken } from '../controllers/authController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authMiddleware, getMe)
router.post('/extension-token', authMiddleware, extensionToken)

export default router
