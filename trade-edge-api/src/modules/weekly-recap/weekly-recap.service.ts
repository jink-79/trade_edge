import { JournalOpen, JournalClosed } from "../journal/journal.model";
import { getJournalTradesClosedBetween, getOpenJournalTrades } from "../journal/journal.service";
import { WeeklyRecap } from "./weekly-recap.model";
import { fetchWeeklyRecapSummary } from "./weekly-recap-ai";
import type {
  WeeklyRecapEntryRow,
  WeeklyRecapExitRow,
  WeeklyRecapResponse,
  WeeklyRecapStats,
} from "./weekly-recap.types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Net P&L when charges were tracked; falls back to gross for trades closed
 * before charges tracking existed — same convention as the dashboard. */
function netPnlFor(t: any): number {
  return t.netPnlAmount ?? t.pnlAmount ?? 0;
}

/** Monday 00:00 UTC of the week containing `d`. */
function mondayOf(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

interface RecapData {
  stats: WeeklyRecapStats;
  entries: WeeklyRecapEntryRow[];
  exits: WeeklyRecapExitRow[];
}

async function buildRecapData(userId: string, weekStart: Date): Promise<RecapData> {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const noShots = "-entry.screenshot -exit.screenshot";

  const [openEntries, closedEntries, exitDocs, openTrades] = await Promise.all([
    JournalOpen.find({ userId, entryDate: { $gte: weekStart, $lt: weekEnd } })
      .select(noShots)
      .lean(),
    JournalClosed.find({ userId, entryDate: { $gte: weekStart, $lt: weekEnd } })
      .select(noShots)
      .lean(),
    getJournalTradesClosedBetween(userId, weekStart, weekEnd),
    getOpenJournalTrades(userId),
  ]);

  const entries: WeeklyRecapEntryRow[] = [...openEntries, ...closedEntries].map((t: any) => ({
    id: String(t._id),
    symbol: t.symbol,
    date: new Date(t.entryDate).toISOString(),
    price: t.entryPrice,
    quantity: t.quantity ?? t.qty ?? 0,
  }));

  const exits: WeeklyRecapExitRow[] = exitDocs.map((t: any) => ({
    id: String(t._id),
    symbol: t.symbol,
    date: new Date(t.exitDate).toISOString(),
    price: t.exitPrice,
    pnl: round2(netPnlFor(t)),
    outcome: t.exitReason,
  }));

  const wins = exits.filter((e) => e.pnl >= 0);
  const netPnl = round2(exits.reduce((s, e) => s + e.pnl, 0));
  const winRate = exits.length ? round2((wins.length / exits.length) * 100) : 0;

  const bestTrade =
    exits.length > 0 ? exits.reduce((m, e) => (e.pnl > m.pnl ? e : m), exits[0]) : null;
  const worstTrade =
    exits.length > 0 ? exits.reduce((m, e) => (e.pnl < m.pnl ? e : m), exits[0]) : null;

  const openUnrealizedPnl = round2(
    openTrades.reduce((s: number, t: any) => {
      if (t.markPrice == null) return s;
      const qty = t.quantity ?? t.qty ?? 0;
      return s + (t.markPrice - t.entryPrice) * qty;
    }, 0),
  );

  return {
    stats: {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      entriesCount: entries.length,
      exitsCount: exits.length,
      netPnl,
      winRate,
      bestTrade: bestTrade ? { symbol: bestTrade.symbol, pnl: bestTrade.pnl } : null,
      worstTrade: worstTrade ? { symbol: worstTrade.symbol, pnl: worstTrade.pnl } : null,
      openPositionsCount: openTrades.length,
      openUnrealizedPnl,
    },
    entries,
    exits,
  };
}

/** `weekStartInput`: any date within the target week — snapped to that
 * week's real Monday here, so the caller doesn't need to compute it. */
export async function getWeeklyRecap(
  userId: string,
  weekStartInput?: string,
): Promise<WeeklyRecapResponse> {
  const weekStart = mondayOf(weekStartInput ? new Date(weekStartInput) : new Date());
  const [{ stats, entries, exits }, cached] = await Promise.all([
    buildRecapData(userId, weekStart),
    WeeklyRecap.findOne({ userId, weekStart }).lean(),
  ]);

  return {
    stats,
    entries,
    exits,
    aiSummary: cached?.aiSummary ?? null,
    aiSummaryGeneratedAt: cached?.aiSummaryGeneratedAt
      ? cached.aiSummaryGeneratedAt.toISOString()
      : null,
  };
}

/** (Re)generates the AI narrative for the week and persists it. */
export async function generateWeeklyRecapSummary(
  userId: string,
  weekStartInput?: string,
): Promise<WeeklyRecapResponse> {
  const weekStart = mondayOf(weekStartInput ? new Date(weekStartInput) : new Date());
  const { stats, entries, exits } = await buildRecapData(userId, weekStart);

  const text = await fetchWeeklyRecapSummary({ stats, entries, exits });
  const now = new Date();

  await WeeklyRecap.findOneAndUpdate(
    { userId, weekStart },
    { userId, weekStart, aiSummary: text, aiSummaryGeneratedAt: now },
    { upsert: true },
  );

  return { stats, entries, exits, aiSummary: text, aiSummaryGeneratedAt: now.toISOString() };
}
