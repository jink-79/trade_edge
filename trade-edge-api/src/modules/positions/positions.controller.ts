import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { sendSuccess, sendCreated } from '../../utils/api-response'
import {
  createPosition,
  getPositions,
  getPositionById,
  exitPosition,
} from './positions.service'
import type { CreatePositionInput, ExitPositionInput } from './positions.types'

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const input = req.body as CreatePositionInput
  const position = await createPosition(userId, input)
  sendCreated(res, position, 'Position created successfully')
})

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const positions = await getPositions()
  sendSuccess(res, positions, 'Positions fetched successfully')
})

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const position = await getPositionById(id)
  sendSuccess(res, position, 'Position fetched successfully')
})

export const exit = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const id = req.params.id as string
  const input = req.body as ExitPositionInput
  const result = await exitPosition(userId, id, input)
  sendSuccess(res, result, 'Position exited and moved to history')
})
