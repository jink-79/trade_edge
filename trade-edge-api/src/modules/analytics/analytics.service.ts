import { JournalClosed as Trade } from '../journal/journal.model'
import { getRecentCandles } from '../../config/phalanx-ohlcv'
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

/** Net P&L when charges were tracked (charges-aware); falls back to the
 * gross figure for trades closed before charges tracking existed — same
 * convention as the dashboard and trade history, so the same trades add up
 * to the same numbers on every page. */
function netPnlFor(t: any): number {
  return t.netPnlAmount ?? t.pnlAmount ?? 0
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

/** yyyy-m sortable key + a short display label — bucketing by month name
 * alone (the old behaviour) silently merged e.g. Jan 2025 and Jan 2026 into
 * one bucket for any range spanning more than a year. */
function monthKey(d: Date): { key: string; label: string } {
  const y = d.getFullYear()
  const m = d.getMonth()
  return { key: `${y}-${String(m).padStart(2, '0')}`, label: `${MONTH_LABELS[m]} '${String(y).slice(2)}` }
}

// ── R-bucket label ────────────────────────────────────────────────────────────
// rMultiple is null until stop-loss tracking is added; we skip distribution
// when no R data exists and return empty array

function rBucketLabel(r: number): string {
  const floored = Math.floor(r)
  if (floored <= -3) return '≤-3R'
  if (floored >= 5)  return '≥+5R'
  return `${floored >= 0 ? '+' : ''}${floored}R`
}

// ── %-return bucket label (fallback when no trade has an rMultiple, e.g. ─────
// Overwatch, which has no fixed stop-loss) — 5-point-wide buckets

function pctBucketLabel(pct: number): string {
  const floored = Math.floor(pct / 5) * 5
  if (floored <= -20) return '≤-20%'
  if (floored >= 20) return '≥+20%'
  return `${floored >= 0 ? '+' : ''}${floored}%`
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

// ── Drawdown episodes from a chronological P&L series ─────────────────────────
// Walks the cumulative equity curve looking for peak -> trough -> new-peak
// cycles, so maxDd/avgDd/recoveryDays are all derived from the same episode
// list instead of maxDd being computed one way and avgDd/recovery being
// invented separately.

function calcDrawdownStats(
  sorted: { pnl: number; date: Date }[],
): { maxDd: number; avgDd: number; recoveryDays: number } {
  let peak = 0
  let peakDate: Date | null = null
  let running = 0
  let inDrawdown = false
  let episodeDepth = 0
  const completed: { depth: number; days: number }[] = []

  for (const t of sorted) {
    running += t.pnl
    if (running >= peak) {
      if (inDrawdown && peakDate) {
        completed.push({
          depth: episodeDepth,
          days: Math.round((t.date.getTime() - peakDate.getTime()) / 86400000),
        })
      }
      peak = running
      peakDate = t.date
      inDrawdown = false
      episodeDepth = 0
    } else {
      inDrawdown = true
      const depth = peak > 0 ? ((peak - running) / peak) * 100 : 0
      episodeDepth = Math.max(episodeDepth, depth)
    }
  }

  const allDepths = [...completed.map((e) => e.depth), ...(inDrawdown ? [episodeDepth] : [])]
  const maxDd = allDepths.length > 0 ? Math.max(...allDepths) : 0
  const avgDd = allDepths.length > 0 ? allDepths.reduce((s, d) => s + d, 0) / allDepths.length : 0
  const recoveryDays =
    completed.length > 0 ? Math.round(completed.reduce((s, e) => s + e.days, 0) / completed.length) : 0

  return { maxDd: round2(maxDd), avgDd: round2(avgDd), recoveryDays }
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

/** Nifty's cumulative return (%) from the first trade's period start to
 * each month bucket, scaled by total invested capital so it's plotted in
 * the same ₹ terms as "you" (the account's own cumulative realized P&L) —
 * "what would this same capital have made sitting in Nifty instead." */
async function buildBenchmark(
  monthOrder: { key: string; label: string; date: Date }[],
  totalInvested: number,
): Promise<{ byKey: Map<string, number>; finalPct: number }> {
  const byKey = new Map<string, number>()
  if (monthOrder.length === 0) return { byKey, finalPct: 0 }

  const rangeStart = monthOrder[0].date
  const daysNeeded = Math.min(
    2000,
    Math.max(30, Math.ceil((Date.now() - rangeStart.getTime()) / 86400000) + 10),
  )
  const candles = await getRecentCandles('NIFTY', daysNeeded)
  if (candles.length === 0) return { byKey, finalPct: 0 }

  const closeOnOrBefore = (target: Date): number | null => {
    let best: number | null = null
    for (const c of candles) {
      const cd = new Date(c.date)
      if (cd.getTime() <= target.getTime()) best = c.close
      else break
    }
    return best ?? candles[0].close
  }

  const baseline = closeOnOrBefore(rangeStart) ?? candles[0].close
  let finalPct = 0
  for (const m of monthOrder) {
    const close = closeOnOrBefore(m.date) ?? baseline
    const pct = baseline > 0 ? ((close - baseline) / baseline) * 100 : 0
    byKey.set(m.key, round2(totalInvested * (pct / 100)))
    finalPct = pct
  }
  return { byKey, finalPct: round2(finalPct) }
}

// ── Main analytics computation ────────────────────────────────────────────────

export async function getAnalytics(userId: string, range: Range): Promise<AnalyticsResponse> {
  const since = getDateFilter(range)

  // The journal's flat mirror fields are typed optional/nullable (they're
  // absent on trades still missing an exit); this query only ever returns
  // already-closed trades, where they're always populated.
  const trades = (await Trade.find({
    userId,
    exitDate: { $gte: since },
  })
    .select("-entry.screenshot -exit.screenshot")
    .sort({ exitDate: 1 })
    .lean()) as any[]

  // ── Base stats ──────────────────────────────────────────────────────────────

  const totalTrades = trades.length
  const wins = trades.filter((t) => netPnlFor(t) > 0)
  const losses = trades.filter((t) => netPnlFor(t) <= 0)

  const winRate = totalTrades > 0 ? round2((wins.length / totalTrades) * 100) : 0

  const grossWin = wins.reduce((s, t) => s + netPnlFor(t), 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + netPnlFor(t), 0))

  const profitFactor = grossLoss > 0 ? round2(grossWin / grossLoss) : grossWin > 0 ? 999 : 0

  const avgWin = wins.length > 0 ? round2(grossWin / wins.length) : 0
  const avgLoss = losses.length > 0 ? round2(grossLoss / losses.length) : 0
  const payoff = avgLoss > 0 ? round2(avgWin / avgLoss) : avgWin > 0 ? 999 : 0

  // Expectancy in ₹ per trade
  const netPnl = round2(trades.reduce((s, t) => s + netPnlFor(t), 0))
  const expectancy = totalTrades > 0 ? round2(netPnl / totalTrades) : 0

  const streaks = calcStreaks(trades.map((t) => netPnlFor(t) > 0))
  const ddStats = calcDrawdownStats(trades.map((t) => ({ pnl: netPnlFor(t), date: new Date(t.exitDate) })))

  // avgHold
  let totalHoldMins = 0
  for (const t of trades) {
    totalHoldMins += holdMinutes(new Date(t.entryDate), new Date(t.exitDate))
  }
  const avgHold = formatAvgHold(totalHoldMins, totalTrades)

  // netPnlPct — relative to total invested across trades
  const totalInvested = trades.reduce((s, t) => s + t.entryPrice * t.qty, 0)
  const netPnlPct = totalInvested > 0 ? round2((netPnl / totalInvested) * 100) : 0

  // ── Equity curve (cumulative P&L by exit month, year-aware) ─────────────────

  const equityByMonth = new Map<string, { label: string; date: Date; you: number }>()
  let running = 0
  for (const t of trades) {
    const exitDate = new Date(t.exitDate)
    const { key, label } = monthKey(exitDate)
    running += netPnlFor(t)
    equityByMonth.set(key, { label, date: exitDate, you: round2(running) })
  }
  const monthOrder = Array.from(equityByMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: v.label, date: v.date, you: v.you }))

  const { byKey: benchByKey, finalPct: benchPct } = await buildBenchmark(monthOrder, totalInvested)

  let peak = 0
  const equityVsBench: EquityPoint[] = monthOrder.map(({ label, key, you }) => {
    if (you > peak) peak = you
    const dd = peak > 0 ? round2(((peak - you) / peak) * 100) : 0
    return { d: label, you, bench: benchByKey.get(key) ?? 0, dd }
  })

  // ── Monthly returns ─────────────────────────────────────────────────────────

  const monthlyPnl = new Map<string, { label: string; pnl: number }>()
  const monthlyInvested = new Map<string, number>()
  for (const t of trades) {
    const { key, label } = monthKey(new Date(t.exitDate))
    const cur = monthlyPnl.get(key) ?? { label, pnl: 0 }
    cur.pnl += netPnlFor(t)
    monthlyPnl.set(key, cur)
    monthlyInvested.set(key, (monthlyInvested.get(key) ?? 0) + t.entryPrice * t.qty)
  }
  const monthlyReturns: MonthlyReturn[] = Array.from(monthlyPnl.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, { label, pnl }]) => {
      const inv = monthlyInvested.get(key) ?? 0
      return { m: label, r: inv > 0 ? round2((pnl / inv) * 100) : 0 }
    })

  // ── R Distribution (only trades with rMultiple set) — falls back to a ───────
  // %-return distribution when none do (Overwatch has no fixed stop-loss, so
  // rMultiple is never set for those trades)

  const rTrades = trades.filter((t) => t.rMultiple !== null)
  const rDistributionMode: 'r' | 'pct' = rTrades.length > 0 ? 'r' : 'pct'
  const distSource = rDistributionMode === 'r' ? rTrades : trades
  const bucketMap = new Map<string, number>()
  for (const t of distSource) {
    const label =
      rDistributionMode === 'r' ? rBucketLabel(t.rMultiple!) : pctBucketLabel(t.pnlPercent ?? 0)
    bucketMap.set(label, (bucketMap.get(label) ?? 0) + 1)
  }
  const rDistribution: RBucket[] = Array.from(bucketMap.entries())
    .map(([bucket, n]) => ({ bucket, n }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket))

  // ── Setup edge (grouped by exitReason) ─────────────────────────────────────

  const setupMap = new Map<string, { wins: number; total: number; pnl: number }>()
  for (const t of trades) {
    const key = t.exitReason
    const entry = setupMap.get(key) ?? { wins: 0, total: 0, pnl: 0 }
    entry.total++
    if (netPnlFor(t) > 0) entry.wins++
    entry.pnl += netPnlFor(t)
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
    entry.pnl += netPnlFor(t)
    entry.trades++
    sectorMap.set(t.sector, entry)
  }
  const sectorPerf: SectorPerf[] = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({ sector, pnl: round2(data.pnl), trades: data.trades }))
    .sort((a, b) => b.pnl - a.pnl)

  // ── Radar ───────────────────────────────────────────────────────────────────

  const radar: RadarPoint[] = scoreRadar({ winRate, profitFactor, payoff, maxDd: ddStats.maxDd, totalTrades, expectancy })

  // ── Held vs R scatter — falls back to held vs %-return when no rMultiple ────

  const heldVsR: ScatterPoint[] = distSource.map((t) => ({
    x: holdMinutes(new Date(t.entryDate), new Date(t.exitDate)),
    y: round2(rDistributionMode === 'r' ? t.rMultiple! : (t.pnlPercent ?? 0)),
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
      entry.pnl += netPnlFor(t)
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

  const stats: AnalyticsStats = {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    winRate,
    expectancy,
    profitFactor,
    sharpe: null,
    sortino: null,
    maxDd: ddStats.maxDd,
    avgDd: ddStats.avgDd,
    recoveryDays: ddStats.recoveryDays,
    avgWin,
    avgLoss,
    payoff,
    bestStreak: streaks.best,
    worstStreak: streaks.worst,
    avgHold,
    netPnl,
    netPnlPct,
    benchPct,
  }

  return {
    range,
    stats,
    equityVsBench,
    monthlyReturns,
    rDistribution,
    rDistributionMode,
    setupEdge,
    sectorPerf,
    radar,
    heldVsR,
    calendar,
  }
}
