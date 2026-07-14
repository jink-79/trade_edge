import { Router } from 'express'
import { getAnalyticsHandler } from './analytics.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { AnalyticsQuerySchema } from './analytics.types'

const router = Router()

router.use(authMiddleware)

// GET /api/analytics?range=YTD
router.get('/', validate(AnalyticsQuerySchema, 'query'), getAnalyticsHandler)

export default router
