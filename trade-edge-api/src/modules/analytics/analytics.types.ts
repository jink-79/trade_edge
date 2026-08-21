import { z } from 'zod'

// ── Range ─────────────────────────────────────────────────────────────────────

export const RANGES = ['1W', '1M', '3M', '6M', 'YTD', '1Y', 'All'] as const
export type Range = (typeof RANGES)[number]

export const AnalyticsQuerySchema = z.object({
  range: z.enum(RANGES).default('YTD'),
})
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>

// ── Chart series ──────────────────────────────────────────────────────────────

export interface EquityPoint {
  d: string
  you: number
  bench: number
  dd: number
}

export interface MonthlyReturn {
  m: string
  r: number
}

export interface RBucket {
  bucket: string
  n: number
}

export interface SetupEdge {
  setup: string
  trades: number
  win: number
  exp: number
}

export interface SectorPerf {
  sector: string
  pnl: number
  trades: number
}

export interface HourlyPnl {
  h: string
  pnl: number
}

export interface RadarPoint {
  k: string
  v: number
}

export interface ScatterPoint {
  x: number
  y: number
  z: number
}

export interface CalendarDay {
  d: number
  r: number
}

// ── Summary stats ─────────────────────────────────────────────────────────────

export interface AnalyticsStats {
  totalTrades: number
  winRate: number
  expectancy: number
  profitFactor: number
  sharpe: null
  sortino: null
  maxDd: number
  avgWin: number
  avgLoss: number
  payoff: number
  bestStreak: number
  worstStreak: number
  avgHold: string
  netPnl: number
  netPnlPct: number
  benchPct: number
}

export interface AnalyticsResponse {
  range: Range
  stats: AnalyticsStats
  equityVsBench: EquityPoint[]
  monthlyReturns: MonthlyReturn[]
  rDistribution: RBucket[]
  // "r" when trades have a stop-loss-derived rMultiple (rsi2); "pct" when they
  // don't (trend-rs55 has no fixed stop, so rDistribution/heldVsR fall back
  // to bucketing/plotting by realized return % instead of R-multiple.
  rDistributionMode: 'r' | 'pct'
  setupEdge: SetupEdge[]
  sectorPerf: SectorPerf[]
  hourly: HourlyPnl[]
  radar: RadarPoint[]
  heldVsR: ScatterPoint[]
  calendar: CalendarDay[]
}
