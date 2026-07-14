import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { sendSuccess } from '../../utils/api-response'
import { getDashboard } from './dashboard.service'

export const getDashboardHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const result = await getDashboard(userId)
  sendSuccess(res, result, 'Dashboard loaded successfully')
})
