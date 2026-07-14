import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { sendSuccess } from '../../utils/api-response'
import { getWeeklySignals } from './signals.service'
import type { SignalsQuery } from './signals.types'

export const getWeeklyScanner = asyncHandler(async (req: Request, res: Response) => {
  const query = (req as any).parsedQuery as SignalsQuery
  const result = await getWeeklySignals(query)

  const message =
    result.totalWeeks === 0
      ? 'No scanner results found yet'
      : `Showing last ${result.totalWeeks} week(s). Latest week: ${result.latestWeek}`

  sendSuccess(res, result, message)
})
