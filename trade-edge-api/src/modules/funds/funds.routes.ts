import { Router } from 'express'
import { getAll, create, remove } from './funds.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { AddFundSchema } from './funds.types'

const router = Router()

// All fund routes require a valid JWT
router.use(authMiddleware)

// GET /api/funds
router.get('/', getAll)

// POST /api/funds
router.post('/', validate(AddFundSchema), create)

// DELETE /api/funds/:id
router.delete('/:id', remove)

export default router
