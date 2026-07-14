import { Router } from 'express'
import { getDashboardHandler } from './dashboard.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

// GET /api/dashboard
router.get('/', getDashboardHandler)

export default router
