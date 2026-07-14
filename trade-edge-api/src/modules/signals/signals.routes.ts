import { Router } from 'express'
import { getWeeklyScanner } from './signals.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { SignalsQuerySchema } from './signals.types'

const router = Router()

router.use(authMiddleware)

// GET /api/signals/weekly-scanner?weeks=4
router.get('/weekly-scanner', validate(SignalsQuerySchema, 'query'), getWeeklyScanner)

export default router
