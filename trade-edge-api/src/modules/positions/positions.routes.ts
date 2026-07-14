import { Router } from 'express'
import { create, getAll, getOne, exit } from './positions.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { CreatePositionSchema, ExitPositionSchema } from './positions.types'

const router = Router()

// All positions routes require a valid JWT
router.use(authMiddleware)

// POST /api/positions
router.post('/', validate(CreatePositionSchema), create)

// GET /api/positions
router.get('/', getAll)

// GET /api/positions/:id
router.get('/:id', getOne)

// POST /api/positions/:id/exit  — close and move to history
router.post('/:id/exit', validate(ExitPositionSchema), exit)

export default router
