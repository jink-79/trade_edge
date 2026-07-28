import { Types } from "mongoose";
import { Fund } from "../funds/funds.model";
import { Position } from "../positions/positions.model";
import { Trade } from "../history/trades.model";
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
  //  - trades (closedpositions): userId stored as a string → scope by string
  //  - positions (openpositions): no userId field → not scoped
  //  - mutualfunds: not user-scoped → return all
  // Exclude base64 chart screenshots from these scans (journal-shaped docs)
  const noShots = "-entry.screenshot -exit.screenshot";
  const [fundDocs, positionDocs, tradeDocs, mfDocs] = await Promise.all([
    Fund.find({ userId: userObjectId }).lean(),
    Position.find({}).select(noShots).lean(),
    Trade.find({ userId }).select(noShots).sort({ exitDate: -1 }).lean(),
    MutualFund.find({}).lean(),
  ]);

  const funds = buildFunds(fundDocs);
  const positions = buildPositions(positionDocs);
  const tradeStats = buildTradeStats(tradeDocs);
  const recentTrades = buildRecentTrades(tradeDocs);
  const pnlChart = buildPnlChart(tradeDocs);
  const setups = buildSetups(tradeDocs);
  const mutualFunds = buildMutualFunds(mfDocs);

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
  };
}
