import { AppError } from "../../utils/api-error";
import {
  autoCreateJournalTrade,
  exitJournalTrade,
  getJournalTradesClosedBetween,
  getOpenJournalTrades,
  updateOpenTradeMark,
} from "../journal/journal.service";
import { JournalOpen } from "../journal/journal.model";
import { getFunds } from "../funds/funds.service";
import { getTodayAndPrevClose } from "../../config/phalanx-ohlcv";
import { logger } from "../../utils/logger";
import { DailyPnlSnapshot } from "./broker-sync.model";
import type { DailyPnlSnapshotResponse, KiteSyncInput, KiteSyncResult } from "./broker-sync.types";

function startOfDay(d: Date): Date {
  const s = new Date(d);
  s.setUTCHours(0, 0, 0, 0);
  return s;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Rebuilds and upserts today's DailyPnlSnapshot from the current DB state —
 * called as the last step of a sync so the snapshot always reflects
 * whatever create/update/exit just happened.
 */
export async function refreshDailySnapshot(userId: string): Promise<DailyPnlSnapshotResponse> {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [openTrades, closedToday, fundsSummary] = await Promise.all([
    getOpenJournalTrades(userId),
    getJournalTradesClosedBetween(userId, dayStart, dayEnd),
    getFunds(userId),
  ]);

  const openPositions = openTrades.map((t: any) => {
    const entryPrice = t.entryPrice ?? 0;
    const quantity = t.quantity ?? t.qty ?? 0;
    const markPrice = t.markPrice ?? null;
    const unrealizedPnl = markPrice != null ? round2((markPrice - entryPrice) * quantity) : 0;
    return {
      symbol: t.symbol,
      quantity,
      entryPrice,
      markPrice,
      unrealizedPnl,
    };
  });
  const unrealizedPnlTotal = round2(openPositions.reduce((s, p) => s + p.unrealizedPnl, 0));

  const closedTodayRows = closedToday.map((t: any) => ({
    symbol: t.symbol,
    exitPrice: t.exitPrice,
    pnlAmount: t.pnlAmount ?? 0,
  }));
  const realizedPnlTotal = round2(closedTodayRows.reduce((s, t) => s + t.pnlAmount, 0));

  const doc = await DailyPnlSnapshot.findOneAndUpdate(
    { userId, date: dayStart },
    {
      userId,
      date: dayStart,
      openPositions,
      unrealizedPnlTotal,
      closedToday: closedTodayRows,
      realizedPnlTotal,
      totalPnl: round2(unrealizedPnlTotal + realizedPnlTotal),
      availableCash: fundsSummary.summary.availableCash,
      generatedAt: now,
    },
    { upsert: true, new: true },
  ).lean();

  return formatSnapshot(doc!);
}

function formatSnapshot(doc: any): DailyPnlSnapshotResponse {
  return {
    date: doc.date.toISOString(),
    openPositions: doc.openPositions,
    unrealizedPnlTotal: doc.unrealizedPnlTotal,
    closedToday: doc.closedToday,
    realizedPnlTotal: doc.realizedPnlTotal,
    totalPnl: doc.totalPnl,
    availableCash: doc.availableCash,
    generatedAt: doc.generatedAt.toISOString(),
  };
}

export async function getLatestDailySnapshot(userId: string): Promise<DailyPnlSnapshotResponse | null> {
  const doc = await DailyPnlSnapshot.findOne({ userId }).sort({ date: -1 }).lean();
  return doc ? formatSnapshot(doc) : null;
}

export async function listDailySnapshots(
  userId: string,
  range: { from?: string; to?: string; limit?: number },
): Promise<DailyPnlSnapshotResponse[]> {
  const filter: Record<string, unknown> = { userId };
  if (range.from || range.to) {
    filter.date = {
      ...(range.from ? { $gte: new Date(range.from) } : {}),
      ...(range.to ? { $lte: new Date(range.to) } : {}),
    };
  }
  const docs = await DailyPnlSnapshot.find(filter)
    .sort({ date: -1 })
    .limit(Math.min(range.limit ?? 60, 200))
    .lean();
  return docs.map(formatSnapshot);
}

/**
 * The actual sync: diff the incoming Kite positions snapshot against this
 * user's open journal trades — new symbols get auto-captured, existing ones
 * get their mark refreshed, and open trades absent from the payload are
 * treated as sold in Kite and auto-exited.
 */
export async function syncKitePositions(userId: string, input: KiteSyncInput): Promise<KiteSyncResult> {
  const incoming = new Map(input.positions.map((p) => [p.symbol, p]));
  const openTrades = await getOpenJournalTrades(userId);
  const openBySymbol = new Map(openTrades.map((t: any) => [t.symbol, t]));

  const created: string[] = [];
  const updated: string[] = [];
  const closed: string[] = [];

  for (const pos of input.positions) {
    const existing = openBySymbol.get(pos.symbol);
    if (!existing) {
      const candles = input.candlesBySymbol[pos.symbol];
      if (!candles) {
        throw AppError.badRequest(
          `${pos.symbol} has no existing open trade and no candles were supplied — candlesBySymbol.${pos.symbol} is required to auto-capture it.`,
        );
      }
      const newTrade = await autoCreateJournalTrade(userId, {
        symbol: pos.symbol,
        entryDate: new Date(),
        entryPrice: pos.avgPrice,
        quantity: pos.quantity,
        direction: "LONG",
        strategyId: "trend-rs55",
        rs55Pct: pos.rs55Pct,
        candles: candles.candles,
        indexCandles: candles.indexCandles,
      });
      await updateOpenTradeMark(userId, newTrade.id, pos.ltp);
      created.push(pos.symbol);
    } else {
      const quantityChanged = (existing.quantity ?? existing.qty) !== pos.quantity;
      await updateOpenTradeMark(
        userId,
        String((existing as any)._id),
        pos.ltp,
        quantityChanged ? pos.quantity : undefined,
      );
      updated.push(pos.symbol);
    }
  }

  for (const trade of openTrades) {
    const t = trade as any;
    if (incoming.has(t.symbol)) continue;
    const exitPrice = t.markPrice ?? t.entryPrice;
    // The sync can't distinguish a genuine trend-flip signal from a manual
    // sale, but trend-flip is the strategy's only real exit mechanism, so
    // that's the accurate default outcome; manualExitReason records how it
    // was actually detected, for later correction if needed.
    await exitJournalTrade(userId, String(t._id), {
      outcome: "TREND-FLIP",
      exitPrice,
      exitDate: new Date(),
      manualExitReason: "Broker sync: no longer in Kite positions/holdings",
    });
    closed.push(t.symbol);
  }

  const snapshot = await refreshDailySnapshot(userId);
  return { created, updated, closed, snapshot };
}

export interface MarkRefreshSummary {
  updated: number;
  skipped: number;
  usersRefreshed: number;
}

/**
 * The Kite-free daily price refresh: mark every open trade (any user) to
 * phalanx-live's own latest OHLCV close, then rebuild each affected user's
 * daily P&L snapshot. Position lifecycle (open/close) isn't touched here —
 * only manual entry / the exit dialog change what's open.
 */
export async function refreshAllMarksFromOhlcv(): Promise<MarkRefreshSummary> {
  const openTrades = await JournalOpen.find({}).select("userId symbol").lean();
  const bySymbol = new Map<string, typeof openTrades>();
  for (const t of openTrades) {
    const list = bySymbol.get(t.symbol!) ?? [];
    list.push(t);
    bySymbol.set(t.symbol!, list);
  }

  let updated = 0;
  let skipped = 0;
  const userIds = new Set<string>();

  for (const [symbol, trades] of bySymbol) {
    const { today } = await getTodayAndPrevClose(symbol);
    if (today?.close == null) {
      logger.warn(`refreshAllMarksFromOhlcv: no OHLCV close for ${symbol}, skipping`);
      skipped += trades.length;
      continue;
    }
    for (const t of trades) {
      await updateOpenTradeMark(
        t.userId,
        String((t as any)._id),
        today.close,
        undefined,
        new Date(today.date),
      );
      userIds.add(t.userId);
      updated++;
    }
  }

  for (const userId of userIds) {
    await refreshDailySnapshot(userId);
  }

  return { updated, skipped, usersRefreshed: userIds.size };
}
