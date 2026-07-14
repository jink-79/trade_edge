import { Trade } from '../history/trades.model'
import type {
  Range,
  AnalyticsResponse,
  AnalyticsStats,
  EquityPoint,
  MonthlyReturn,
  RBucket,
  SetupEdge,
  SectorPerf,
  RadarPoint,
  ScatterPoint,
  CalendarDay,
} from './analytics.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDateFilter(range: Range): Date {
  const now = new Date()
  switch (range) {
    case '1W': return new Date(now.getTime() - 7 * 86400000)
    case '1M': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case '3M': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '6M': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case 'YTD': return new Date(now.getFullYear(), 0, 1)
    case '1Y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case 'All': return new Date(0)
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function holdMinutes(entryDate: Date, exitDate: Date): number {
  return Math.round((exitDate.getTime() - entryDate.getTime()) / 60000)
}

function formatAvgHold(totalMinutes: number, count: number): string {
  if (count === 0) return '0d'
  const avg = totalMinutes / count
  if (avg < 60) return `${Math.round(avg)}m`
  if (avg < 1440) return `${Math.round(avg / 60)}h`
  return `${Math.round(avg / 1440)}d`
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── R-bucket label ────────────────────────────────────────────────────────────
// rMultiple is null until stop-loss tracking is added; we skip distribution
// when no R data exists and return empty array

function rBucketLabel(r: number): string {
  const floored = Math.floor(r)
  if (floored <= -3) return '≤-3R'
  if (floored >= 5)  return '≥+5R'
  return `${floored >= 0 ? '+' : ''}${floored}R`
}

// ── Streak calculation ────────────────────────────────────────────────────────

function calcStreaks(wins: boolean[]): { best: number; worst: number } {
  let best = 0, worst = 0, cur = 0
  for (const w of wins) {
    cur = w ? cur + 1 : 0
    best = Math.max(best, cur)
  }
  cur = 0
  for (const w of wins) {
    cur = w ? 0 : cur + 1
    worst = Math.max(worst, cur)
  }
  return { best, worst }
}

// ── Max drawdown from cumulative PnL series ───────────────────────────────────

function calcMaxDrawdown(sortedPnls: number[]): number {
  let peak = 0, maxDd = 0, running = 0
  for (const pnl of sortedPnls) {
    running += pnl
    if (running > peak) peak = running
    const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0
    if (dd > maxDd) maxDd = dd
  }
  return round2(maxDd)
}

// ── Radar scorer (0–100) ──────────────────────────────────────────────────────

function scoreRadar(stats: {
  winRate: number
  profitFactor: number
  payoff: number
  maxDd: number
  totalTrades: number
  expectancy: number
}): RadarPoint[] {
  return [
    { k: 'Win Rate',      v: Math.min(100, round2(stats.winRate)) },
    { k: 'Profit Factor', v: Math.min(100, round2(stats.profitFactor * 20)) },
    { k: 'Payoff',        v: Math.min(100, round2(stats.payoff * 25)) },
    { k: 'Consistency',   v: Math.min(100, round2(Math.max(0, 100 - stats.maxDd * 2))) },
    { k: 'Activity',      v: Math.min(100, round2(stats.totalTrades * 2)) },
    { k: 'Expectancy',    v: Math.min(100, round2(Math.max(0, stats.expectancy * 10))) },
  ]
}

// ── Main analytics computation ────────────────────────────────────────────────

export async function getAnalytics(userId: string, range: Range): Promise<AnalyticsResponse> {
  const since = getDateFilter(range)

  const trades = await Trade.find({
    userId,
    exitDate: { $gte: since },
  })
    .sort({ exitDate: 1 })
    .lean()

  // ── Base stats ──────────────────────────────────────────────────────────────

  const totalTrades = trades.length
  const wins = trades.filter((t) => t.pnlAmount > 0)
  const losses = trades.filter((t) => t.pnlAmount <= 0)

  const winRate = totalTrades > 0 ? round2((wins.length / totalTrades) * 100) : 0

  const grossWin = wins.reduce((s, t) => s + t.pnlAmount, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlAmount, 0))

  const profitFactor = grossLoss > 0 ? round2(grossWin / grossLoss) : grossWin > 0 ? 999 : 0

  const avgWin = wins.length > 0 ? round2(grossWin / wins.length) : 0
  const avgLoss = losses.length > 0 ? round2(grossLoss / losses.length) : 0
  const payoff = avgLoss > 0 ? round2(avgWin / avgLoss) : avgWin > 0 ? 999 : 0

  // Expectancy in ₹ per trade
  const netPnl = round2(trades.reduce((s, t) => s + t.pnlAmount, 0))
  const expectancy = totalTrades > 0 ? round2(netPnl / totalTrades) : 0

  const streaks = calcStreaks(trades.map((t) => t.pnlAmount > 0))
  const maxDd = calcMaxDrawdown(trades.map((t) => t.pnlAmount))

  // avgHold
  let totalHoldMins = 0
  for (const t of trades) {
    totalHoldMins += holdMinutes(new Date(t.entryDate), new Date(t.exitDate))
  }
  const avgHold = formatAvgHold(totalHoldMins, totalTrades)

  // netPnlPct — relative to total invested across trades
  const totalInvested = trades.reduce((s, t) => s + t.entryPrice * t.qty, 0)
  const netPnlPct = totalInvested > 0 ? round2((netPnl / totalInvested) * 100) : 0

  const stats: AnalyticsStats = {
    totalTrades,
    winRate,
    expectancy,
    profitFactor,
    sharpe: null,
    sortino: null,
    maxDd,
    avgWin,
    avgLoss,
    payoff,
    bestStreak: streaks.best,
    worstStreak: streaks.worst,
    avgHold,
    netPnl,
    netPnlPct,
    benchPct: 0, // populated when Nifty data is wired
  }

  // ── Equity curve (cumulative PnL by exit month) ─────────────────────────────

  const equityByMonth = new Map<string, number>()
  let running = 0
  for (const t of trades) {
    const label = MONTH_LABELS[new Date(t.exitDate).getMonth()]
    running += t.pnlAmount
    equityByMonth.set(label, round2(running))
  }
  let peak = 0
  const equityVsBench: EquityPoint[] = Array.from(equityByMonth.entries()).map(([d, you]) => {
    if (you > peak) peak = you
    const dd = peak > 0 ? round2(((peak - you) / peak) * 100) : 0
    return { d, you, bench: 0, dd }
  })

  // ── Monthly returns ─────────────────────────────────────────────────────────

  const monthlyPnl = new Map<string, number>()
  const monthlyInvested = new Map<string, number>()
  for (const t of trades) {
    const label = MONTH_LABELS[new Date(t.exitDate).getMonth()]
    monthlyPnl.set(label, (monthlyPnl.get(label) ?? 0) + t.pnlAmount)
    monthlyInvested.set(label, (monthlyInvested.get(label) ?? 0) + t.entryPrice * t.qty)
  }
  const monthlyReturns: MonthlyReturn[] = Array.from(monthlyPnl.entries()).map(([m, pnl]) => {
    const inv = monthlyInvested.get(m) ?? 0
    return { m, r: inv > 0 ? round2((pnl / inv) * 100) : 0 }
  })

  // ── R Distribution (only trades with rMultiple set) ─────────────────────────

  const rTrades = trades.filter((t) => t.rMultiple !== null)
  const rBucketMap = new Map<string, number>()
  for (const t of rTrades) {
    const label = rBucketLabel(t.rMultiple!)
    rBucketMap.set(label, (rBucketMap.get(label) ?? 0) + 1)
  }
  const rDistribution: RBucket[] = Array.from(rBucketMap.entries())
    .map(([bucket, n]) => ({ bucket, n }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket))

  // ── Setup edge (grouped by exitReason) ─────────────────────────────────────

  const setupMap = new Map<string, { wins: number; total: number; pnl: number }>()
  for (const t of trades) {
    const key = t.exitReason
    const entry = setupMap.get(key) ?? { wins: 0, total: 0, pnl: 0 }
    entry.total++
    if (t.pnlAmount > 0) entry.wins++
    entry.pnl += t.pnlAmount
    setupMap.set(key, entry)
  }
  const setupEdge: SetupEdge[] = Array.from(setupMap.entries()).map(([setup, data]) => ({
    setup,
    trades: data.total,
    win: round2((data.wins / data.total) * 100),
    exp: round2(data.pnl / data.total),
  }))

  // ── Sector performance ──────────────────────────────────────────────────────

  const sectorMap = new Map<string, { pnl: number; trades: number }>()
  for (const t of trades) {
    const entry = sectorMap.get(t.sector) ?? { pnl: 0, trades: 0 }
    entry.pnl += t.pnlAmount
    entry.trades++
    sectorMap.set(t.sector, entry)
  }
  const sectorPerf: SectorPerf[] = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({ sector, pnl: round2(data.pnl), trades: data.trades }))
    .sort((a, b) => b.pnl - a.pnl)

  // ── Hourly PnL (by exit hour) ───────────────────────────────────────────────
  // NSE trades typically exit at EOD; this is more meaningful with intraday data
  // but we include it so the chart is populated when intraday trades are added

  const hourlyMap = new Map<string, number>()
  for (const t of trades) {
    const hour = new Date(t.exitDate).getHours()
    const label = `${hour}:00`
    hourlyMap.set(label, (hourlyMap.get(label) ?? 0) + t.pnlAmount)
  }
  const hourly = Array.from(hourlyMap.entries())
    .map(([h, pnl]) => ({ h, pnl: round2(pnl) }))
    .sort((a, b) => parseInt(a.h) - parseInt(b.h))

  // ── Radar ───────────────────────────────────────────────────────────────────

  const radar: RadarPoint[] = scoreRadar({ winRate, profitFactor, payoff, maxDd, totalTrades, expectancy })

  // ── Held vs R scatter (only trades with rMultiple) ──────────────────────────

  const heldVsR: ScatterPoint[] = rTrades.map((t) => ({
    x: holdMinutes(new Date(t.entryDate), new Date(t.exitDate)),
    y: round2(t.rMultiple!),
    z: t.entryPrice * t.qty,
  }))

  // ── Calendar (days in current month with return %) ──────────────────────────

  const now = new Date()
  const calendarMap = new Map<number, { pnl: number; invested: number }>()
  for (const t of trades) {
    const d = new Date(t.exitDate)
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      const day = d.getDate()
      const entry = calendarMap.get(day) ?? { pnl: 0, invested: 0 }
      entry.pnl += t.pnlAmount
      entry.invested += t.entryPrice * t.qty
      calendarMap.set(day, entry)
    }
  }
  const calendar: CalendarDay[] = Array.from(calendarMap.entries())
    .map(([d, data]) => ({
      d,
      r: data.invested > 0 ? round2((data.pnl / data.invested) * 100) : 0,
    }))
    .sort((a, b) => a.d - b.d)

  return {
    range,
    stats,
    equityVsBench,
    monthlyReturns,
    rDistribution,
    setupEdge,
    sectorPerf,
    hourly,
    radar,
    heldVsR,
    calendar,
  }
}
