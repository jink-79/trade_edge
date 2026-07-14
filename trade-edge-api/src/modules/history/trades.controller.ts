import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { sendSuccess, sendCreated } from '../../utils/api-response'
import { createTrade, getTradesByUser, getTradeById } from './trades.service'
import type { CreateTradeInput } from './trades.types'

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const input = req.body as CreateTradeInput
  const trade = await createTrade(userId, input)
  sendCreated(res, trade, 'Trade recorded successfully')
})

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const trades = await getTradesByUser(userId)
  sendSuccess(res, trades, 'Trades fetched successfully')
})

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const id = req.params.id as string
  const trade = await getTradeById(id, userId)
  sendSuccess(res, trade, 'Trade fetched successfully')
})
