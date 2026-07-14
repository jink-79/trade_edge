import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { sendSuccess } from '../../utils/api-response'
import { getAnalytics } from './analytics.service'
import type { AnalyticsQuery } from './analytics.types'

export const getAnalyticsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const { range } = (req as any).parsedQuery as AnalyticsQuery
  const result = await getAnalytics(userId, range)
  sendSuccess(res, result, 'Analytics computed successfully')
})
