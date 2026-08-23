import { Router } from 'express'
import { getAll, create, remove, statement } from './funds.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { AddFundSchema } from './funds.types'

const router = Router()

// All fund routes require a valid JWT
router.use(authMiddleware)

// GET /api/funds
router.get('/', getAll)

// GET /api/funds/statement  — Zerodha-style running ledger (deposits + trade
// buys/sells with running balance), synthesized on read, not stored
router.get('/statement', statement)

// POST /api/funds
router.post('/', validate(AddFundSchema), create)

// DELETE /api/funds/:id
router.delete('/:id', remove)

export default router
