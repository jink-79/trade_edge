import { z } from 'zod'

// ── Query Schema ──────────────────────────────────────────────────────────────

export const SignalsQuerySchema = z.object({
  weeks: z.preprocess(
    (val) => (val === undefined ? 4 : Number(val)),
    z.number().min(1).max(12).default(4),
  ),
})

export type SignalsQuery = z.infer<typeof SignalsQuerySchema>

// ── Response Types ────────────────────────────────────────────────────────────

export interface SignalStock {
  symbol: string
  close: number
  breakout_level: number
  volume: number
  avg_volume_20: number
}

export interface WeeklySignal {
  week: string        // week_key  e.g. "2025-W03"
  signalWeek: string  // human label from signal_week field
  count: number
  stocks: SignalStock[]
}

export interface SignalsResponse {
  latestWeek: string | null
  totalWeeks: number
  data: WeeklySignal[]
}
