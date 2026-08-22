import { AppError } from "../../utils/api-error";
import {
  autoCreateJournalTrade,
  exitJournalTrade,
  getOpenJournalTrades,
  updateOpenTradeMark,
} from "../journal/journal.service";
import { JournalOpen } from "../journal/journal.model";
import { getTodayAndPrevClose, getRecentCandles } from "../../config/phalanx-ohlcv";
import { computeMansfieldRsSeries } from "../journal/journal.compute";
import { logger } from "../../utils/logger";
import type { KiteSyncInput, KiteSyncResult } from "./broker-sync.types";

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

  return { created, updated, closed };
}

export interface MarkRefreshSummary {
  updated: number;
  skipped: number;
  usersRefreshed: number;
}

/**
 * The Kite-free daily price refresh: mark every open trade (any user) to
 * phalanx-live's own latest OHLCV close. Position lifecycle (open/close)
 * isn't touched here — only manual entry / the exit dialog change what's
 * open.
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

  // Shared across every symbol below — one fetch, not one per position.
  const niftyCandles = await getRecentCandles("NIFTY");

  for (const [symbol, trades] of bySymbol) {
    const { today, prev } = await getTodayAndPrevClose(symbol);
    if (today?.close == null) {
      logger.warn(`refreshAllMarksFromOhlcv: no OHLCV close for ${symbol}, skipping`);
      skipped += trades.length;
      continue;
    }

    // Current Mansfield RS (vs Nifty, EMA 55) — a live reading, distinct
    // from entry.rs55Pct which is the frozen value from the entry signal.
    // Needs the full candle history (55+ bar EMA warmup), not just the
    // 2-bar today/prev fetch above.
    const symbolCandles = await getRecentCandles(symbol);
    const rsSeries = computeMansfieldRsSeries(symbolCandles, niftyCandles, 55);
    const markRs = rsSeries[rsSeries.length - 1] ?? null;

    for (const t of trades) {
      await updateOpenTradeMark(
        t.userId,
        String((t as any)._id),
        today.close,
        undefined,
        new Date(today.date),
        prev?.close,
        markRs,
      );
      userIds.add(t.userId);
      updated++;
    }
  }

  return { updated, skipped, usersRefreshed: userIds.size };
}
