import { Types } from "mongoose";
import { Fund } from "../funds/funds.model";
import { JournalOpen, JournalClosed } from "../journal/journal.model";
import { MutualFund } from "../mutual-funds/mutual-funds.model";
import { FUND_CATEGORIES } from "../mutual-funds/mutual-funds.types";
import { FUND_TYPES } from "../funds/funds.types";
import type {
  DashboardResponse,
  DashboardFunds,
  DashboardPositions,
  DashboardTradeStats,
  DashboardRecentTrade,
  DashboardPnlPoint,
  DashboardSetup,
  DashboardMutualFunds,
  DashboardPortfolio,
  DashboardInsights,
  DashboardSegmentStats,
} from "./dashboard.types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function holdMinutes(entry: Date, exit: Date): number {
  return Math.round((exit.getTime() - entry.getTime()) / 60000);
}

function formatAvgHold(totalMins: number, count: number): string {
  if (count === 0) return "0d";
  const avg = totalMins / count;
  if (avg < 60) return `${Math.round(avg)}m`;
  if (avg < 1440) return `${Math.round(avg / 60)}h`;
  return `${Math.round(avg / 1440)}d`;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function last6MonthKeys(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(MONTH_LABELS[d.getMonth()]);
  }
  return keys;
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildFunds(fundDocs: any[]): DashboardFunds {
  const byType = Object.fromEntries(FUND_TYPES.map((t) => [t, 0])) as Record<
    string,
    number
  >;
  let totalDeposited = 0;
  for (const f of fundDocs) {
    totalDeposited += f.amount;
    byType[f.type] += f.amount;
  }
  return { totalDeposited: round2(totalDeposited), byType };
}

function buildPositions(positionDocs: any[]): DashboardPositions {
  let totalInvested = 0;
  let long = 0;
  let short = 0;
  for (const p of positionDocs) {
    // openpositions uses `qty` and has no `side` (scanner longs)
    const qty = p.quantity ?? p.qty ?? 0;
    const invested = p.entryPrice * qty;
    totalInvested += invested;
    if ((p.side ?? "long") === "short") short += invested;
    else long += invested;
  }
  return {
    openCount: positionDocs.length,
    totalInvested: round2(totalInvested),
    breakdown: { long: round2(long), short: round2(short) },
  };
}

function buildTradeStats(tradeDocs: any[]): DashboardTradeStats {
  const total = tradeDocs.length;
  if (total === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      netPnl: 0,
      profitFactor: 0,
      avgHold: "0d",
    };
  }

  const wins = tradeDocs.filter((t) => t.pnlAmount > 0);
  const losses = tradeDocs.filter((t) => t.pnlAmount <= 0);
  const grossWin = wins.reduce((s: number, t: any) => s + t.pnlAmount, 0);
  const grossLoss = Math.abs(
    losses.reduce((s: number, t: any) => s + t.pnlAmount, 0),
  );

  let totalHoldMins = 0;
  for (const t of tradeDocs) {
    totalHoldMins += holdMinutes(new Date(t.entryDate), new Date(t.exitDate));
  }

  return {
    totalTrades: total,
    winRate: round2((wins.length / total) * 100),
    netPnl: round2(tradeDocs.reduce((s: number, t: any) => s + t.pnlAmount, 0)),
    profitFactor:
      grossLoss > 0 ? round2(grossWin / grossLoss) : grossWin > 0 ? 999 : 0,
    avgHold: formatAvgHold(totalHoldMins, total),
  };
}

function buildRecentTrades(
  tradeDocs: any[],
  limit = 5,
): DashboardRecentTrade[] {
  return tradeDocs.slice(0, limit).map((t: any) => ({
    id: String(t._id),
    symbol: t.symbol,
    exitDate: new Date(t.exitDate).toISOString(),
    pnlAmount: round2(t.pnlAmount),
    pnlPercent: round2(t.pnlPercent),
    exitReason: t.exitReason,
  }));
}

function buildPnlChart(tradeDocs: any[]): DashboardPnlPoint[] {
  const monthKeys = last6MonthKeys();
  const pnlByMonth = new Map<string, number>(monthKeys.map((k) => [k, 0]));

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (const t of tradeDocs) {
    const exitDate = new Date(t.exitDate);
    if (exitDate < sixMonthsAgo) continue;
    const label = MONTH_LABELS[exitDate.getMonth()];
    if (pnlByMonth.has(label)) {
      pnlByMonth.set(label, (pnlByMonth.get(label) ?? 0) + t.pnlAmount);
    }
  }

  let cumulative = 0;
  return monthKeys.map((month) => {
    const pnl = round2(pnlByMonth.get(month) ?? 0);
    cumulative = round2(cumulative + pnl);
    return { month, pnl, cumulative };
  });
}

function buildSetups(tradeDocs: any[]): DashboardSetup[] {
  const map = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of tradeDocs) {
    const key = t.exitReason || "Unknown";
    const e = map.get(key) ?? { wins: 0, total: 0, pnl: 0 };
    e.total++;
    if (t.pnlAmount > 0) e.wins++;
    e.pnl += t.pnlAmount;
    map.set(key, e);
  }
  return Array.from(map.entries())
    .map(([setup, d]) => ({
      setup,
      trades: d.total,
      winRate: round2((d.wins / d.total) * 100),
      avgPnl: round2(d.pnl / d.total),
    }))
    .sort((a, b) => b.avgPnl - a.avgPnl);
}

/** Net P&L when charges were tracked (charges-aware); falls back to the
 * gross figure for trades closed before charges tracking existed. */
function netPnlFor(t: any): number {
  return t.netPnlAmount ?? t.pnlAmount ?? 0;
}

/** R-multiple with the same fallback the closed-trades table uses: a real
 * stop-based risk unit when one exists, else ATR(14) at entry (Trend+RS-55
 * has no fixed stop). Reads the nested entry/exit — the flat `rMultiple`
 * mirror is stop-only and is null for every no-stop trade. */
function rMultipleFor(t: any): number | null {
  const entry = t.entry;
  const exit = t.exit;
  if (!entry || !exit || exit.exitPrice == null) return null;
  const long = String(entry.direction ?? "LONG") === "LONG";
  const pnlPerShare = long
    ? exit.exitPrice - entry.entryPrice
    : entry.entryPrice - exit.exitPrice;
  const stopRisk =
    entry.stopPrice == null
      ? null
      : long
        ? entry.entryPrice - entry.stopPrice
        : entry.stopPrice - entry.entryPrice;
  if (stopRisk != null && stopRisk > 0) return pnlPerShare / stopRisk;
  if (entry.atr14 > 0) return pnlPerShare / entry.atr14;
  return null;
}

function buildMfeCapture(tradeDocs: any[]): DashboardInsights["mfeCapture"] {
  const ratios = tradeDocs
    .map((t) => t.analytics?.mfeCaptureRatio)
    .filter((r): r is number => typeof r === "number" && Number.isFinite(r));
  if (ratios.length === 0) return { avgCapturePct: null, sampleSize: 0 };
  const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  return { avgCapturePct: round2(avg * 100), sampleSize: ratios.length };
}

function buildExpectancy(tradeDocs: any[]): DashboardInsights["expectancy"] {
  const total = tradeDocs.length;
  if (total === 0) {
    return {
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      expectancyPerTrade: 0,
      avgWinR: null,
      avgLossR: null,
      expectancyR: null,
    };
  }

  const wins = tradeDocs.filter((t) => netPnlFor(t) > 0);
  const losses = tradeDocs.filter((t) => netPnlFor(t) <= 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + netPnlFor(t), 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + netPnlFor(t), 0) / losses.length)
      : 0;

  const rValues = tradeDocs
    .map((t) => rMultipleFor(t))
    .filter((r): r is number => r != null);
  const winRs = rValues.filter((r) => r > 0);
  const lossRs = rValues.filter((r) => r <= 0);
  const avgWinR = winRs.length > 0 ? winRs.reduce((s, r) => s + r, 0) / winRs.length : null;
  const avgLossR =
    lossRs.length > 0 ? Math.abs(lossRs.reduce((s, r) => s + r, 0) / lossRs.length) : null;

  return {
    winRate: round2((wins.length / total) * 100),
    avgWin: round2(avgWin),
    avgLoss: round2(avgLoss),
    expectancyPerTrade: round2(
      tradeDocs.reduce((s, t) => s + netPnlFor(t), 0) / total,
    ),
    avgWinR: avgWinR != null ? round2(avgWinR) : null,
    avgLossR: avgLossR != null ? round2(avgLossR) : null,
    expectancyR:
      rValues.length > 0
        ? round2(rValues.reduce((s, r) => s + r, 0) / rValues.length)
        : null,
  };
}

/** tradeDocs must already be sorted newest-first (exitDate desc). */
function buildStreak(tradeDocs: any[]): DashboardInsights["streak"] {
  if (tradeDocs.length === 0) {
    return { current: 0, bestWinStreak: 0, worstLossStreak: 0 };
  }

  const isWin = (t: any) => netPnlFor(t) > 0;

  let current = 0;
  const firstWin = isWin(tradeDocs[0]);
  for (const t of tradeDocs) {
    if (isWin(t) !== firstWin) break;
    current++;
  }
  current = firstWin ? current : -current;

  let bestWinStreak = 0;
  let worstLossStreak = 0;
  let run = 0;
  let runIsWin: boolean | null = null;
  for (const t of tradeDocs) {
    const win = isWin(t);
    if (win === runIsWin) {
      run++;
    } else {
      runIsWin = win;
      run = 1;
    }
    if (win) bestWinStreak = Math.max(bestWinStreak, run);
    else worstLossStreak = Math.max(worstLossStreak, run);
  }

  return { current, bestWinStreak, worstLossStreak };
}

const R_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "< -2R", min: -Infinity, max: -2 },
  { label: "-2R to -1R", min: -2, max: -1 },
  { label: "-1R to 0", min: -1, max: 0 },
  { label: "0 to 1R", min: 0, max: 1 },
  { label: "1R to 2R", min: 1, max: 2 },
  { label: "2R to 3R", min: 2, max: 3 },
  { label: "> 3R", min: 3, max: Infinity },
];

function buildRMultipleBuckets(tradeDocs: any[]): DashboardInsights["rMultipleBuckets"] {
  const counts = new Map(R_BUCKETS.map((b) => [b.label, 0]));
  for (const t of tradeDocs) {
    const r = rMultipleFor(t);
    if (r == null) continue;
    const bucket = R_BUCKETS.find((b) => r >= b.min && r < b.max) ?? R_BUCKETS[R_BUCKETS.length - 1];
    counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1);
  }
  return R_BUCKETS.map((b) => ({ label: b.label, count: counts.get(b.label) ?? 0 }));
}

function segmentStats(group: any[]): DashboardSegmentStats | null {
  if (group.length === 0) return null;
  const wins = group.filter((t) => netPnlFor(t) > 0).length;
  return {
    trades: group.length,
    winRate: round2((wins / group.length) * 100),
    avgPnl: round2(group.reduce((s, t) => s + netPnlFor(t), 0) / group.length),
  };
}

function buildSegmentedPerformance(
  tradeDocs: any[],
): DashboardInsights["segmented"] {
  const system = tradeDocs.filter((t) => t.ruleAdherence === "system");
  const discretionary = tradeDocs.filter((t) => t.ruleAdherence === "discretionary");
  const up = tradeDocs.filter((t) => t.entry?.niftyVs200Ema === "up");
  const down = tradeDocs.filter((t) => t.entry?.niftyVs200Ema === "down");

  return {
    ruleAdherence: {
      system: segmentStats(system),
      discretionary: segmentStats(discretionary),
    },
    regime: {
      up: segmentStats(up),
      down: segmentStats(down),
    },
  };
}

function buildSectorConcentration(
  positionDocs: any[],
): DashboardInsights["sectorConcentration"] {
  const bySector = new Map<string, number>();
  let total = 0;
  for (const p of positionDocs) {
    const qty = p.quantity ?? p.qty ?? 0;
    const invested = (p.entryPrice ?? p.entry?.entryPrice ?? 0) * qty;
    const sector = p.entry?.sector || p.sector || "Unknown";
    bySector.set(sector, (bySector.get(sector) ?? 0) + invested);
    total += invested;
  }
  return Array.from(bySector.entries())
    .map(([sector, invested]) => ({
      sector,
      invested: round2(invested),
      pct: total > 0 ? round2((invested / total) * 100) : 0,
    }))
    .sort((a, b) => b.invested - a.invested);
}

function buildInsights(tradeDocs: any[], positionDocs: any[]): DashboardInsights {
  return {
    mfeCapture: buildMfeCapture(tradeDocs),
    expectancy: buildExpectancy(tradeDocs),
    streak: buildStreak(tradeDocs),
    rMultipleBuckets: buildRMultipleBuckets(tradeDocs),
    segmented: buildSegmentedPerformance(tradeDocs),
    sectorConcentration: buildSectorConcentration(positionDocs),
  };
}

function buildMutualFunds(mfDocs: any[]): DashboardMutualFunds {
  const byCategory = Object.fromEntries(
    FUND_CATEGORIES.map((c) => [c, 0]),
  ) as Record<string, number>;

  let totalInvested = 0;
  for (const m of mfDocs) {
    totalInvested += m.amount;
    if (byCategory[m.category] !== undefined) {
      byCategory[m.category] += m.amount;
    }
  }

  return {
    totalInvested: round2(totalInvested),
    totalEntries: mfDocs.length,
    byCategory: byCategory as DashboardMutualFunds["byCategory"],
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const userObjectId = new Types.ObjectId(userId);

  // Each collection has its own scoping reality:
  //  - funds: userId stored as ObjectId (app-written) → scope by ObjectId
  //  - openpositions/closedpositions (journal): userId stored as a string → scope by string
  //  - mutualfunds: not user-scoped → return all
  // Exclude base64 chart screenshots from these scans (journal-shaped docs)
  const noShots = "-entry.screenshot -exit.screenshot";
  const [fundDocs, positionDocs, tradeDocs, mfDocs] = await Promise.all([
    Fund.find({ userId: userObjectId }).lean(),
    JournalOpen.find({ userId }).select(noShots).lean(),
    JournalClosed.find({ userId }).select(noShots).sort({ exitDate: -1 }).lean(),
    MutualFund.find({}).lean(),
  ]);

  const funds = buildFunds(fundDocs);
  const positions = buildPositions(positionDocs);
  const tradeStats = buildTradeStats(tradeDocs);
  const recentTrades = buildRecentTrades(tradeDocs);
  const pnlChart = buildPnlChart(tradeDocs);
  const setups = buildSetups(tradeDocs);
  const mutualFunds = buildMutualFunds(mfDocs);
  const insights = buildInsights(tradeDocs, positionDocs);

  const portfolio: DashboardPortfolio = {
    totalFundsDeposited: funds.totalDeposited,
    totalOpenInvested: positions.totalInvested,
    totalMfInvested: mutualFunds.totalInvested,
    totalNetPnl: tradeStats.netPnl,
    totalValue: round2(funds.totalDeposited + tradeStats.netPnl),
  };

  return {
    portfolio,
    funds,
    positions,
    tradeStats,
    recentTrades,
    pnlChart,
    setups,
    mutualFunds,
    insights,
  };
}
