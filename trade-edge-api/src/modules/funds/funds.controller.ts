import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { sendSuccess, sendCreated } from '../../utils/api-response'
import { getFunds, addFund, deleteFund, getFundsStatement } from './funds.service'
import type { AddFundInput } from './funds.types'

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const result = await getFunds(userId)
  sendSuccess(res, result, 'Funds fetched successfully')
})

export const statement = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const result = await getFundsStatement(userId)
  sendSuccess(res, result, 'Statement fetched successfully')
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const input = req.body as AddFundInput
  const fund = await addFund(userId, input)
  sendCreated(res, fund, 'Fund entry added successfully')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const id = req.params.id as string
  await deleteFund(id, userId)
  sendSuccess(res, null, 'Fund entry deleted successfully')
})
