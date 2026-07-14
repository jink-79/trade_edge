import { Router } from 'express'
import { create, getAll, getOne } from './trades.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { CreateTradeSchema } from './trades.types'

const router = Router()

// All trade routes require a valid JWT
router.use(authMiddleware)

// POST /api/trades
router.post('/', validate(CreateTradeSchema), create)

// GET /api/trades
router.get('/', getAll)

// GET /api/trades/:id
router.get('/:id', getOne)

export default router
