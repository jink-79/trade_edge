import { Signal } from './signals.model'
import type { SignalsQuery, SignalsResponse, WeeklySignal } from './signals.types'

export async function getWeeklySignals(query: SignalsQuery): Promise<SignalsResponse> {
  const { weeks } = query

  // Step 1 — find the last N unique week_keys available in the collection
  const weekDocs = await Signal.aggregate([
    { $group: { _id: '$week_key' } },
    { $sort: { _id: -1 } },
    { $limit: weeks },
  ])

  const weekKeys: string[] = weekDocs.map((w: { _id: string }) => w._id)

  if (weekKeys.length === 0) {
    return { latestWeek: null, totalWeeks: 0, data: [] }
  }

  // Step 2 — fetch and group all signals for those weeks
  const results = await Signal.aggregate([
    { $match: { week_key: { $in: weekKeys } } },
    {
      $group: {
        _id: '$week_key',
        signal_week: { $first: '$signal_week' },
        stocks: {
          $push: {
            symbol: '$symbol',
            close: '$close',
            breakout_level: '$breakout_level',
            volume: '$volume',
            avg_volume_20: '$avg_volume_20',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ])

  const data: WeeklySignal[] = results.map((r: any) => ({
    week: r._id,
    signalWeek: r.signal_week,
    count: r.count,
    stocks: r.stocks,
  }))

  return {
    latestWeek: data[0]?.week ?? null,
    totalWeeks: data.length,
    data,
  }
}
