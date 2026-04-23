import { Router } from 'express'
import { getJobs, getJob, create, update, remove } from '../controllers/jobsController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Todas as rotas de vagas são protegidas
router.use(authMiddleware)

router.get('/', getJobs)
router.get('/:id', getJob)
router.post('/', create)
router.patch('/:id', update)
router.delete('/:id', remove)

export default router
