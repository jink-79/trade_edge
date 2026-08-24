import mongoose from "mongoose";
import { JournalOpen, JournalClosed } from "./journal.model";
import { AppError } from "../../utils/api-error";
import {
  computeEntryIndicators,
  computeRegime,
  computeRs55,
  computeMansfieldRsSeries,
  computeStockStrength,
  computeLiveIndicators,
  type StockStrength,
  type LiveIndicators,
} from "./journal.compute";
import { analyzeTradePath } from "./journal.analytics";
import { getPreferences } from "../preferences/preferences.service";
import { getCandleWindow, getRecentCandles, getSymbolMeta } from "../../config/phalanx-ohlcv";
import { logger } from "../../utils/logger";
import { fetchPositionAiReview } from "./journal.ai-review";
import { fetchExitSummary } from "./journal.exit-ai";
import { computeCharges } from "./journal.charges";
import { checkEntryAdherence, checkExitAdherence } from "./journal.rule-check";
import { fetchTradeInsight } from "./journal.trade-insight";
import { fetchReviewNoteDraft } from "./journal.review-note-ai";
import type {
  AnalyzeTradeInput,
  AutoCaptureInput,
  CreateJournalTradeInput,
  ExitJournalTradeInput,
  ExitSummaryInput,
  JournalTradeResponse,
  ManualEntryInput,
  ReviewJournalTradeInput,
  SetAdherenceInput,
  SetReviewNoteInput,
} from "./journal.types";

const round2 = (n: number) => Math.round(n * 100) / 100;
const LIST_PROJECTION = "-entry.screenshot -exit.screenshot";

function formatTrade(doc: any): JournalTradeResponse {
  return {
    id: String(doc._id),
    tradeNumber: doc.tradeNumber,
    entry: doc.entry,
    exit: doc.exit ?? null,
    outcome: doc.outcome,
    dataQuality: doc.dataQuality,
    dataQualityNote: doc.dataQualityNote ?? null,
    source: doc.source ?? "manual",
    strategyId: doc.strategyId ?? null,
    needsReview: doc.needsReview ?? false,
    gttPlaced: doc.gttPlaced ?? false,
    ruleAdherence: doc.ruleAdherence ?? null,
    ruleAdherenceNote: doc.ruleAdherenceNote ?? null,
    analytics: doc.analytics ?? null,
    tradeInsight: doc.tradeInsight ?? null,
    reviewNote: doc.reviewNote ?? null,
    reviewNoteSource: doc.reviewNoteSource ?? null,
    reviewNoteUpdatedAt: doc.reviewNoteUpdatedAt ?? null,
    markPrice: doc.markPrice ?? null,
    markUpdatedAt: doc.markUpdatedAt ?? null,
    markDate: doc.markDate ?? null,
    markPrevClose: doc.markPrevClose ?? null,
    markRs: doc.markRs ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Fetch a mutable trade doc from whichever collection holds it. */
async function findEitherDoc(userId: string, id: string) {
  return (
    (await JournalOpen.findOne({ _id: id, userId })) ||
    (await JournalClosed.findOne({ _id: id, userId }))
  );
}

export interface TradeChartResponse {
  symbol: string;
  candles: import("../../config/phalanx-ohlcv").PlainCandle[];
  /** Mansfield RS vs Nifty (EMA 55) at every bar in `candles`, same index
   * alignment — the same indicator shown on TradingView, not phalanx-live's
   * own rs55 entry-signal formula (that's `entryPrice`'s rs55Pct, unchanged). */
  rsSeries: (number | null)[];
  entryDate: string;
  entryPrice: number;
  exitDate: string | null;
  exitPrice: number | null;
}

const CHART_BARS_BEFORE_ENTRY = 60;
const RS_EMA_PERIOD = 55;

/** Live fetch from phalanx's Atlas cluster: ~60 daily bars before entry
 * through `endDate`, plus a Mansfield RS line aligned to those bars. Only
 * ever accurate while phalanx-live still retains that date range — it trims
 * OHLCV older than ~500 trading days (retention_daily.py), which is why a
 * CLOSED trade's chart gets snapshotted permanently at exit time instead of
 * re-fetched live forever (see buildChartSnapshot / exitJournalTrade). */
async function fetchLiveChart(
  symbol: string,
  entryDate: Date | string,
  endDate: Date | string,
): Promise<{ candles: import("../../config/phalanx-ohlcv").PlainCandle[]; rsSeries: (number | null)[] }> {
  const [candles, stockWithRsContext, niftyWithRsContext] = await Promise.all([
    getCandleWindow(symbol, entryDate, endDate, CHART_BARS_BEFORE_ENTRY),
    getCandleWindow(symbol, entryDate, endDate, CHART_BARS_BEFORE_ENTRY + RS_EMA_PERIOD),
    getCandleWindow("NIFTY", entryDate, endDate, CHART_BARS_BEFORE_ENTRY + RS_EMA_PERIOD),
  ]);
  const rsFull = computeMansfieldRsSeries(stockWithRsContext, niftyWithRsContext, RS_EMA_PERIOD);
  const rsSeries = rsFull.slice(rsFull.length - candles.length);
  return { candles, rsSeries };
}

/** Chart data for the trade-detail candlestick chart. Closed trades read
 * their permanent `chartSnapshot` (captured once, at exit) instead of
 * hitting phalanx live — its OHLCV retention window rolls forward and would
 * otherwise blank out an old trade's chart. Still-open trades always fetch
 * live, since the position is still moving. A closed trade from before this
 * snapshot existed falls back to a live fetch and backfills the snapshot for
 * next time, best-effort (phalanx may have already trimmed that data by
 * then, in which case it just stays empty). */
export async function getTradeChart(userId: string, id: string): Promise<TradeChartResponse> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) throw AppError.notFound("Trade not found");

  const entry = doc.entry as Record<string, any>;
  const exit = doc.exit as Record<string, any> | null;
  const snapshot = (doc as any).chartSnapshot as
    | { candles: any[]; rsSeries: (number | null)[] }
    | null
    | undefined;

  let candles: import("../../config/phalanx-ohlcv").PlainCandle[];
  let rsSeries: (number | null)[];

  if (exit && snapshot) {
    candles = snapshot.candles;
    rsSeries = snapshot.rsSeries;
  } else {
    const live = await fetchLiveChart(entry.ticker, entry.entryDate, exit?.exitDate ?? new Date());
    candles = live.candles;
    rsSeries = live.rsSeries;
    if (exit && candles.length > 0) {
      doc.set("chartSnapshot", { candles, rsSeries, capturedAt: new Date() });
      await doc.save();
    }
  }

  return {
    symbol: entry.ticker,
    candles,
    rsSeries,
    entryDate: new Date(entry.entryDate).toISOString(),
    entryPrice: entry.entryPrice,
    exitDate: exit ? new Date(exit.exitDate).toISOString() : null,
    exitPrice: exit?.exitPrice ?? null,
  };
}

/** Technical strength scorecard for this trade's symbol — purely rule-based
 * off the LATEST available OHLCV (not frozen at entry/exit), so it reflects
 * the stock's current state whether the position is still open or long
 * closed. Uses the same 300-day window computeEntryIndicators reads, since
 * a real 200 EMA needs real warmup. */
export async function getStockStrength(userId: string, id: string): Promise<StockStrength> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) throw AppError.notFound("Trade not found");

  const entry = doc.entry as Record<string, any>;
  const [stockCandles, niftyCandles] = await Promise.all([
    getRecentCandles(entry.ticker),
    getRecentCandles("NIFTY"),
  ]);

  const strength = computeStockStrength(stockCandles, niftyCandles);
  if (!strength) {
    throw AppError.badRequest(
      `Not enough price history for ${entry.ticker} yet to compute a strength score.`,
    );
  }
  return strength;
}

/** Raw technical indicator panel (EMAs, RSI, Mansfield RS, MACD, ADX, price
 * action) for this trade's symbol, off the LATEST available OHLCV — same
 * live-vs-frozen behavior as getStockStrength, just the actual numbers
 * instead of a weighted scorecard. */
export async function getLiveIndicators(userId: string, id: string): Promise<LiveIndicators> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) throw AppError.notFound("Trade not found");

  const entry = doc.entry as Record<string, any>;
  const [stockCandles, niftyCandles] = await Promise.all([
    getRecentCandles(entry.ticker),
    getRecentCandles("NIFTY"),
  ]);

  const indicators = computeLiveIndicators(stockCandles, niftyCandles, entry.ticker);
  if (!indicators) {
    throw AppError.badRequest(
      `Not enough price history for ${entry.ticker} yet to compute technical indicators.`,
    );
  }
  return indicators;
}

/** Flat top-level fields the dashboard/analytics Position & Trade models read. */
function entryMirror(entry: any) {
  return {
    symbol: entry.ticker,
    stockName: entry.ticker,
    sector: entry.sector,
    side: String(entry.direction ?? "LONG").toLowerCase(),
    entryPrice: entry.entryPrice,
    quantity: entry.quantity,
    qty: entry.quantity,
    entryDate: entry.entryDate,
    tradeDate: entry.entryDate,
    targetPrice: entry.targetPrice,
    stopPrice: entry.stopPrice,
  };
}

/** `entry.quantity` here is the EXITED quantity (the full quantity for a full
 * exit, a scaled-down slice for a partial one) — the caller is responsible
 * for passing the right slice in. */
function computeExitMetrics(entry: any, exit: any) {
  const long = String(entry.direction ?? "LONG") === "LONG";
  const pnlPerShare = long
    ? exit.exitPrice - entry.entryPrice
    : entry.entryPrice - exit.exitPrice;
  const pnlAmount = round2(pnlPerShare * entry.quantity);
  const invested = entry.entryPrice * entry.quantity;
  const risk = long
    ? entry.entryPrice - entry.stopPrice
    : entry.stopPrice - entry.entryPrice;

  const charges = computeCharges(invested, entry.quantity * exit.exitPrice);
  const netPnlAmount = round2(pnlAmount - charges.totalCharges);

  return {
    pnlAmount,
    pnlPercent: invested > 0 ? round2((pnlAmount / invested) * 100) : 0,
    rMultiple: risk > 0 ? round2(pnlPerShare / risk) : null,
    charges,
    netPnlAmount,
  };
}

async function nextTradeNumber(userId: string): Promise<number> {
  const [open, closed] = await Promise.all([
    JournalOpen.countDocuments({ userId }),
    JournalClosed.countDocuments({ userId }),
  ]);
  return open + closed + 1;
}

export async function setGttPlaced(
  userId: string,
  id: string,
  placed: boolean,
): Promise<JournalTradeResponse> {
  const trade = await JournalOpen.findOneAndUpdate(
    { _id: id, userId },
    { gttPlaced: placed },
    { new: true },
  ).lean();
  if (!trade) throw AppError.notFound("Open trade not found");
  return formatTrade(trade);
}

export async function createJournalTrade(
  userId: string,
  input: CreateJournalTradeInput,
): Promise<JournalTradeResponse> {
  const tradeNumber = await nextTradeNumber(userId);
  const doc = await JournalOpen.create({
    userId,
    tradeNumber,
    entry: input.entry,
    exit: null,
    outcome: "STILL-OPEN",
    dataQuality: input.dataQuality,
    dataQualityNote: input.dataQualityNote ?? null,
    ...entryMirror(input.entry),
  });
  return formatTrade(doc.toObject());
}

/** List a user's trades (open + closed), newest first, without screenshots. */
export async function getJournalTrades(
  userId: string,
): Promise<JournalTradeResponse[]> {
  const filter = { userId, entry: { $exists: true } };
  const [open, closed] = await Promise.all([
    JournalOpen.find(filter).select(LIST_PROJECTION).lean(),
    JournalClosed.find(filter).select(LIST_PROJECTION).lean(),
  ]);
  return [...open, ...closed]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map(formatTrade);
}

export async function getJournalTradeById(
  userId: string,
  id: string,
): Promise<JournalTradeResponse> {
  const doc =
    (await JournalOpen.findOne({ _id: id, userId }).lean()) ||
    (await JournalClosed.findOne({ _id: id, userId }).lean());
  if (!doc) throw AppError.notFound("Trade not found");
  return formatTrade(doc);
}

/** If this user already holds an OPEN position in this symbol (same
 * strategy), fold a new buy into it instead of creating a second,
 * disconnected trade record — weighted-average entry price, combined
 * quantity. The original entry date and every technical/context field
 * (RS-55, ATR, EMA distances, regime, sector, ...) are left untouched: they
 * describe the signal that justified opening the position, and adding size
 * later isn't a new signal event worth re-snapshotting. Never touches a
 * CLOSED trade — once a position has been fully exited, a new buy of the
 * same symbol is genuinely a new position, not a continuation. Returns the
 * merged doc, or null if there's nothing open to merge into. */
async function mergeIntoExistingOpenPosition(
  userId: string,
  ticker: string,
  strategyId: string | null | undefined,
  addPrice: number,
  addQuantity: number,
): Promise<any | null> {
  const existing = await JournalOpen.findOne({
    userId,
    "entry.ticker": ticker,
    strategyId: strategyId ?? null,
  });
  if (!existing) return null;

  const existingEntry = existing.entry as any;
  const totalQty = existingEntry.quantity + addQuantity;
  const weightedPrice = round2(
    (existingEntry.entryPrice * existingEntry.quantity + addPrice * addQuantity) / totalQty,
  );

  existing.set("entry.entryPrice", weightedPrice);
  existing.set("entry.quantity", totalQty);
  existing.set("entryPrice", weightedPrice);
  existing.set("quantity", totalQty);
  existing.set("qty", totalQty);
  await existing.save();
  return existing.toObject();
}

export async function autoCreateJournalTrade(
  userId: string,
  input: AutoCaptureInput,
): Promise<JournalTradeResponse> {
  const merged = await mergeIntoExistingOpenPosition(
    userId,
    input.symbol,
    input.strategyId,
    input.entryPrice,
    input.quantity,
  );
  if (merged) return formatTrade(merged);

  const prefs = await getPreferences(userId);
  const slMult = input.slAtrMultiplier ?? prefs.slAtrMultiplier;
  const tgtMult = input.targetAtrMultiplier ?? prefs.targetAtrMultiplier;

  const entryDateIso = new Date(input.entryDate).toISOString();
  const ind = computeEntryIndicators(
    input.candles,
    input.entryPrice,
    entryDateIso,
    prefs.atrPeriod,
  );
  const regime = computeRegime(input.indexCandles);

  // Backfill RS-55 the same way phalanx-live computes it (55-trading-day
  // stock return vs Nifty return) when the caller didn't already supply a
  // value — e.g. a manual entry for a stock that wasn't that day's ranked
  // buy candidate still gets a real RS-55 reading, not a blank dash.
  const rs55Pct =
    input.rs55Pct ?? computeRs55(input.candles, input.indexCandles, entryDateIso);

  // Backfill sector/market-cap bucket from phalanx-live's own reference data
  // when the caller didn't already supply one — never overrides an explicit
  // value (e.g. from a manual review edit).
  const meta =
    input.sector == null || input.marketCapCategory == null
      ? await getSymbolMeta(input.symbol)
      : null;

  // Only rsi2 trades use fixed exit levels; other strategies (trend-flip-only
  // exits, no stop-loss) leave target/stop unset rather than inventing them.
  const usesAtrLevels = input.strategyId === "rsi2";
  const stopPrice = usesAtrLevels
    ? (input.stopPrice ?? round2(input.entryPrice - slMult * ind.atr14))
    : input.stopPrice;
  const targetPrice = usesAtrLevels
    ? (input.targetPrice ?? round2(input.entryPrice + tgtMult * ind.atr14))
    : input.targetPrice;

  const entry = {
    ticker: input.symbol,
    entryDate: input.entryDate,
    direction: input.direction,
    entryPrice: input.entryPrice,
    quantity: input.quantity,
    targetPrice,
    stopPrice,
    rs55Pct,
    atr14: ind.atr14,
    priceAbove200: ind.priceAbove200,
    distanceFrom200Ema: ind.distanceFrom200Ema,
    rsi2: ind.rsi2,
    candlesFromHigh: ind.candlesFromHigh,
    pullbackDepth: ind.pullbackDepth,
    entryCandleClose: ind.entryCandleClose,
    distanceTo50Ema: ind.distanceTo50Ema,
    downMoveVolume: ind.downMoveVolume,
    targetUnderResistance: false,
    stopHasSupport: false,
    niftyVs200Ema: regime.niftyVs200Ema,
    niftyRsi2: regime.niftyRsi2,
    sector: input.sector ?? meta?.sector ?? "Unknown",
    marketCapCategory: input.marketCapCategory ?? meta?.marketCapCategory ?? null,
    gappedIntoEntry: ind.gappedIntoEntry,
    candlesAvailable: input.candlesAvailable ?? input.candles.length,
    eventWithinWindow: false,
    screenshot: null,
    aiAnalysis: null,
    notes: null,
  };

  const tradeNumber = await nextTradeNumber(userId);
  const doc = await JournalOpen.create({
    userId,
    tradeNumber,
    entry,
    exit: null,
    outcome: "STILL-OPEN",
    dataQuality: "clean",
    dataQualityNote: null,
    source: "auto",
    strategyId: input.strategyId,
    needsReview: true,
    ...entryMirror(entry),
  });

  return formatTrade(doc.toObject());
}

/**
 * Manual open for the Trend+RS-55 strategy — no Kite session needed. Candles
 * come straight from phalanx-live's own OHLCV (already refreshed daily by
 * its GitHub Action), so this is just autoCreateJournalTrade with a
 * different candle source; needsReview is false since these were typed in
 * directly, not auto-captured from a broker feed to be sanity-checked later.
 */
export async function createManualTrendTrade(
  userId: string,
  input: ManualEntryInput,
): Promise<JournalTradeResponse> {
  const [candles, indexCandles] = await Promise.all([
    getRecentCandles(input.symbol),
    getRecentCandles("NIFTY"),
  ]);
  if (candles.length < 2) {
    throw AppError.badRequest(
      `${input.symbol} has no price history in Atlas yet — phalanx-live may not track this symbol.`,
    );
  }

  const trade = await autoCreateJournalTrade(userId, {
    symbol: input.symbol,
    entryDate: input.entryDate ?? new Date(),
    entryPrice: input.entryPrice,
    quantity: input.quantity,
    direction: "LONG",
    strategyId: "trend-rs55",
    candles,
    indexCandles,
  });

  // Mark it immediately from the same candles we just fetched, rather than
  // leaving Since-entry/Mark/Today blank until the next scheduled
  // refreshAllMarksFromOhlcv run (could be hours away) — the data already
  // exists in Atlas, no reason to wait.
  const latest = candles[candles.length - 1];
  const prevBar = candles[candles.length - 2];
  const rsSeries = computeMansfieldRsSeries(candles, indexCandles, 55);
  const markRs = rsSeries[rsSeries.length - 1] ?? null;
  await updateOpenTradeMark(
    userId,
    trade.id,
    latest.close,
    undefined,
    new Date(latest.date),
    prevBar?.close,
    markRs,
  );

  const doc = await JournalOpen.findOneAndUpdate(
    { _id: trade.id, userId },
    { needsReview: false },
    { new: true },
  ).lean();
  return formatTrade(doc);
}

/** On-demand AI take on a held position — not persisted, fetched fresh each
 * time the user asks for it. */
export async function getAiReviewForTrade(
  userId: string,
  id: string,
): Promise<{ aiReview: string }> {
  const trade = await JournalOpen.findOne({ _id: id, userId }).lean();
  if (!trade) throw AppError.notFound("Open trade not found");
  const entry = trade.entry as Record<string, any>;

  const aiReview = await fetchPositionAiReview({
    symbol: entry.ticker,
    entryPrice: entry.entryPrice,
    entryDate: entry.entryDate,
    markPrice: trade.markPrice ?? null,
    sector: entry.sector ?? null,
    marketCapCategory: entry.marketCapCategory ?? null,
  });
  return { aiReview };
}

/**
 * One-time-per-symbol backfill for open positions created before sector /
 * market-cap-category / RS-55 were sourced automatically. Only fills gaps —
 * never overwrites a value that's already set — and is safe to re-run as
 * phalanx-live backfills more symbols over time.
 */
export async function backfillPositionMeta(): Promise<{
  checked: number;
  updated: number;
  stillMissing: string[];
}> {
  const openTrades = await JournalOpen.find({}).lean();
  let updated = 0;
  const stillMissing: string[] = [];

  for (const trade of openTrades as any[]) {
    const entry = trade.entry as Record<string, any>;
    const needsSector = !entry.sector || entry.sector === "Unknown";
    const needsMcap = entry.marketCapCategory == null;
    const needsRs55 = entry.rs55Pct == null;
    if (!needsSector && !needsMcap && !needsRs55) continue;

    const meta = needsSector || needsMcap ? await getSymbolMeta(entry.ticker) : null;

    const update: Record<string, unknown> = {};
    if (needsSector && meta?.sector) {
      update["entry.sector"] = meta.sector;
      update.sector = meta.sector; // keep the flat mirror in sync
    }
    if (needsMcap && meta?.marketCapCategory) {
      update["entry.marketCapCategory"] = meta.marketCapCategory;
    }
    if (needsRs55) {
      const [candles, indexCandles] = await Promise.all([
        getRecentCandles(entry.ticker),
        getRecentCandles("NIFTY"),
      ]);
      const rs55Pct = computeRs55(
        candles,
        indexCandles,
        new Date(entry.entryDate).toISOString(),
      );
      if (rs55Pct != null) update["entry.rs55Pct"] = rs55Pct;
    }

    if (Object.keys(update).length > 0) {
      await JournalOpen.updateOne({ _id: trade._id }, { $set: update });
      updated++;
    } else if (needsSector || needsMcap) {
      stillMissing.push(entry.ticker);
    }
  }

  logger.info(
    `backfillPositionMeta: checked ${openTrades.length}, updated ${updated}, still missing meta for [${stillMissing.join(", ")}]`,
  );
  return { checked: openTrades.length, updated, stillMissing };
}

export async function reviewJournalTrade(
  userId: string,
  id: string,
  input: ReviewJournalTradeInput,
): Promise<JournalTradeResponse> {
  const trade = await JournalOpen.findOne({ _id: id, userId });
  if (!trade) throw AppError.notFound("Open trade not found");

  const entry = trade.entry as Record<string, any>;
  if (input.screenshot !== undefined) entry.screenshot = input.screenshot;
  if (input.aiAnalysis !== undefined) entry.aiAnalysis = input.aiAnalysis;
  if (input.targetUnderResistance !== undefined)
    entry.targetUnderResistance = input.targetUnderResistance;
  if (input.stopHasSupport !== undefined)
    entry.stopHasSupport = input.stopHasSupport;
  if (input.sector !== undefined) {
    entry.sector = input.sector;
    trade.sector = input.sector; // keep the flat mirror in sync
  }
  if (input.eventWithinWindow !== undefined)
    entry.eventWithinWindow = input.eventWithinWindow;
  if (input.notes !== undefined) entry.notes = input.notes;
  if (input.dataQuality !== undefined) trade.dataQuality = input.dataQuality;

  trade.markModified("entry");
  trade.needsReview = false;
  await trade.save();

  return formatTrade(trade.toObject());
}

/** Days between entry and exit — used both for the closed-doc snapshot and
 * for the AI exit-summary context. */
function holdingDaysBetween(entryDate: Date | string, exitDate: Date | string): number {
  return Math.max(
    0,
    Math.floor((new Date(exitDate).getTime() - new Date(entryDate).getTime()) / 86_400_000),
  );
}

/**
 * Records the exit. A FULL exit (quantity omitted, or equal to the position's
 * full held quantity) moves the trade from openpositions → closedpositions,
 * same as before. A PARTIAL exit (quantity < held quantity) instead creates a
 * new closed doc for just the exited slice and decrements the open doc's
 * quantity by that amount — the position stays open with the remainder.
 * Both paths compute realised P&L / R / charges (stored flat for
 * dashboard & analytics). Atomic either way.
 */
export async function exitJournalTrade(
  userId: string,
  id: string,
  input: ExitJournalTradeInput,
): Promise<JournalTradeResponse> {
  const open: any = await JournalOpen.findOne({ _id: id, userId }).lean();
  if (!open) throw AppError.notFound("Open trade not found");

  const fullQuantity = open.entry.quantity as number;
  const exitQuantity = input.quantity ?? fullQuantity;
  if (exitQuantity > fullQuantity) {
    throw AppError.badRequest(
      `Can't exit ${exitQuantity} shares — only ${fullQuantity} are held.`,
    );
  }
  const isPartial = exitQuantity < fullQuantity;

  const exit = {
    outcome: input.outcome,
    exitPrice: input.exitPrice,
    exitDate: input.exitDate,
    quantity: exitQuantity,
    manualExitReason: input.manualExitReason ?? null,
    stopWickedThenRecovered: input.stopWickedThenRecovered ?? null,
    targetTaggedThenReversed: input.targetTaggedThenReversed ?? null,
    maxAdverseExcursion: input.maxAdverseExcursion ?? null,
    screenshot: input.screenshot ?? null,
    aiAnalysis: input.aiAnalysis ?? null,
  };
  // The exited slice's own entry snapshot — same entry data, scaled quantity.
  const exitedEntry = { ...open.entry, quantity: exitQuantity };
  const metrics = computeExitMetrics(exitedEntry, exit);

  // Captured now, while phalanx-live's Atlas cluster still has every bar of
  // this trade's life — its OHLCV retention window (~500 trading days) rolls
  // forward and would otherwise blank out this chart years down the line.
  // Best-effort: a live-fetch failure here shouldn't block the exit itself.
  let chartSnapshot: { candles: any[]; rsSeries: (number | null)[]; capturedAt: Date } | null = null;
  try {
    const live = await fetchLiveChart(exitedEntry.ticker, exitedEntry.entryDate, exit.exitDate);
    if (live.candles.length > 0) {
      chartSnapshot = { candles: live.candles, rsSeries: live.rsSeries, capturedAt: new Date() };
    }
  } catch (err) {
    logger.warn(
      `exitJournalTrade: chart snapshot failed for ${exitedEntry.ticker}: ${err instanceof Error ? err.message : "unknown error"}`,
    );
  }

  const closedDoc = {
    _id: isPartial ? new mongoose.Types.ObjectId() : open._id,
    userId: open.userId,
    tradeNumber: open.tradeNumber,
    entry: exitedEntry,
    exit: { ...exit, charges: metrics.charges, netPnlAmount: metrics.netPnlAmount },
    outcome: input.outcome,
    dataQuality: open.dataQuality,
    dataQualityNote: open.dataQualityNote ?? null,
    source: open.source,
    strategyId: open.strategyId ?? null,
    needsReview: false,
    gttPlaced: open.gttPlaced,
    createdAt: isPartial ? new Date() : open.createdAt,
    chartSnapshot,
    ...entryMirror(exitedEntry),
    exitPrice: exit.exitPrice,
    exitDate: exit.exitDate,
    exitReason: exit.outcome,
    pnlAmount: metrics.pnlAmount,
    pnlPercent: metrics.pnlPercent,
    rMultiple: metrics.rMultiple,
    netPnlAmount: metrics.netPnlAmount,
    totalCharges: metrics.charges.totalCharges,
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await JournalClosed.create([closedDoc], { session });
      if (isPartial) {
        const remaining = fullQuantity - exitQuantity;
        await JournalOpen.updateOne(
          { _id: id },
          {
            $set: {
              "entry.quantity": remaining,
              quantity: remaining,
              qty: remaining,
            },
          },
          { session },
        );
      } else {
        await JournalOpen.deleteOne({ _id: id }, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  const created = await JournalClosed.findById(closedDoc._id).lean();
  return formatTrade(created);
}

/**
 * On-demand, not-yet-persisted exit summary — generated from the draft exit
 * inputs so the user can see (and regenerate) it before confirming the exit.
 * The frontend sends this text back as `aiAnalysis` on the real exit call.
 */
export async function getExitSummaryPreview(
  userId: string,
  id: string,
  input: ExitSummaryInput,
): Promise<{ summary: string }> {
  const open: any = await JournalOpen.findOne({ _id: id, userId }).lean();
  if (!open) throw AppError.notFound("Open trade not found");

  const fullQuantity = open.entry.quantity as number;
  const exitQuantity = input.quantity ?? fullQuantity;
  if (exitQuantity > fullQuantity) {
    throw AppError.badRequest(
      `Can't exit ${exitQuantity} shares — only ${fullQuantity} are held.`,
    );
  }

  const exitedEntry = { ...open.entry, quantity: exitQuantity };
  const metrics = computeExitMetrics(exitedEntry, { exitPrice: input.exitPrice });

  const summary = await fetchExitSummary({
    symbol: open.entry.ticker,
    direction: open.entry.direction,
    entryPrice: open.entry.entryPrice,
    exitPrice: input.exitPrice,
    exitQuantity,
    fullQuantity,
    holdingDays: holdingDaysBetween(open.entry.entryDate, input.exitDate),
    pnlPercent: metrics.pnlPercent,
    netPnlAmount: metrics.netPnlAmount,
    totalCharges: metrics.charges.totalCharges,
    outcome: input.outcome,
  });
  return { summary };
}

/**
 * Comprehensive AI review of a CLOSED trade against the strategy's own
 * rules — verifies the entry/exit against phalanx-live's own daily_signals
 * record (was this symbol actually flagged that day, or a discretionary
 * override?) and asks Gemini to judge the setup, the exit, and what could
 * have gone better. Persisted so it isn't regenerated on every page view;
 * call again to regenerate.
 */
export async function generateTradeInsight(
  userId: string,
  id: string,
): Promise<JournalTradeResponse> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) {
    throw AppError.notFound("Trade not found");
  }

  const entry = doc.entry as Record<string, any>;
  const exit = doc.exit as Record<string, any> | null;

  const entryCheck = await checkEntryAdherence(entry.ticker, entry.entryDate);

  if (exit) {
    const exitCheck = await checkExitAdherence(entry.ticker, exit.exitDate);
    const metrics = computeExitMetrics(entry, exit);

    const text = await fetchTradeInsight({
      symbol: entry.ticker,
      sector: entry.sector ?? null,
      marketCapCategory: entry.marketCapCategory ?? null,
      entryDate: new Date(entry.entryDate).toISOString(),
      entryPrice: entry.entryPrice,
      quantity: entry.quantity,
      rs55AtEntry: entry.rs55Pct ?? null,
      distanceFrom200Ema: entry.distanceFrom200Ema,
      distanceTo50Ema: entry.distanceTo50Ema,
      niftyRegimeAtEntry: entry.niftyVs200Ema,
      entryCheck,
      exitDate: new Date(exit.exitDate).toISOString(),
      exitPrice: exit.exitPrice,
      outcome: exit.outcome,
      daysHeld: holdingDaysBetween(entry.entryDate, exit.exitDate),
      exitCheck,
      grossPnlPct: metrics.pnlPercent,
      netPnlAmount: exit.netPnlAmount ?? metrics.netPnlAmount,
      totalCharges: exit.charges?.totalCharges ?? metrics.charges.totalCharges,
      markPrice: null,
      unrealizedPct: null,
      manualNote: exit.manualExitReason ?? exit.aiAnalysis ?? null,
    });

    doc.set("tradeInsight", { text, entryCheck, exitCheck, generatedAt: new Date() });
    await doc.save();
    return formatTrade(doc.toObject());
  }

  const markPrice = (doc as any).markPrice ?? null;
  const unrealizedPct =
    markPrice != null ? ((markPrice - entry.entryPrice) / entry.entryPrice) * 100 : null;

  const text = await fetchTradeInsight({
    symbol: entry.ticker,
    sector: entry.sector ?? null,
    marketCapCategory: entry.marketCapCategory ?? null,
    entryDate: new Date(entry.entryDate).toISOString(),
    entryPrice: entry.entryPrice,
    quantity: entry.quantity,
    rs55AtEntry: entry.rs55Pct ?? null,
    distanceFrom200Ema: entry.distanceFrom200Ema,
    distanceTo50Ema: entry.distanceTo50Ema,
    niftyRegimeAtEntry: entry.niftyVs200Ema,
    entryCheck,
    exitDate: null,
    exitPrice: null,
    outcome: null,
    daysHeld: holdingDaysBetween(entry.entryDate, new Date()),
    exitCheck: null,
    grossPnlPct: null,
    netPnlAmount: null,
    totalCharges: null,
    markPrice,
    unrealizedPct,
    manualNote: null,
  });

  doc.set("tradeInsight", { text, entryCheck, exitCheck: null, generatedAt: new Date() });
  await doc.save();
  return formatTrade(doc.toObject());
}

/**
 * Compute MAE/MFE + exit-strategy replays from the daily candles spanning the
 * trade's life, and store them on the doc (open or closed).
 */
export async function analyzeJournalTrade(
  userId: string,
  id: string,
  input: AnalyzeTradeInput,
): Promise<JournalTradeResponse> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) throw AppError.notFound("Trade not found");

  const entry = doc.entry as Record<string, any>;
  const exit = doc.exit as Record<string, any> | null;

  const analytics = analyzeTradePath(input.candles, {
    direction: entry.direction,
    entryPrice: entry.entryPrice,
    stopPrice: entry.stopPrice,
    targetPrice: entry.targetPrice,
    quantity: entry.quantity,
    atr14: entry.atr14,
    entryDateIso: new Date(entry.entryDate).toISOString(),
    exitDateIso: exit?.exitDate ? new Date(exit.exitDate).toISOString() : null,
    exitPrice: exit?.exitPrice ?? null,
  });

  doc.set("analytics", analytics);
  doc.markModified("analytics");
  // Backfill the exit's MAE% now that we've measured it.
  if (exit) {
    exit.maxAdverseExcursion = analytics.maePct;
    doc.markModified("exit");
  }
  await doc.save();
  return formatTrade(doc.toObject());
}

/** All open trades for a user, raw. */
export async function getOpenJournalTrades(userId: string) {
  return JournalOpen.find({ userId }).select(LIST_PROJECTION).lean();
}

/** Closed trades whose exitDate falls within [start, end) — used by the
 * weekly recap. */
export async function getJournalTradesClosedBetween(userId: string, start: Date, end: Date) {
  return JournalClosed.find({ userId, exitDate: { $gte: start, $lt: end } })
    .select(LIST_PROJECTION)
    .lean();
}

export interface RefreshMarksResult {
  updated: number;
  symbols: number;
  failedSymbols: string[];
}

/**
 * Daily mark-price refresh for EVERY open position, across every user — a
 * cron job, not a per-user action (see journal.routes.ts's requireCronSecret
 * gate). Groups open trades by symbol first so each symbol's OHLCV (and its
 * Mansfield RS series) is only fetched once no matter how many trades or
 * users hold it, then fans the same mark out to every one of those trades.
 * This is the piece that went missing when broker-sync's own refresh-marks
 * cron was removed — without it, markPrice/markRs freeze at whatever they
 * were on the day the position was opened.
 */
export async function refreshAllOpenMarks(): Promise<RefreshMarksResult> {
  const openTrades = await JournalOpen.find({}).select("_id userId entry.ticker").lean();
  if (openTrades.length === 0) return { updated: 0, symbols: 0, failedSymbols: [] };

  const bySymbol = new Map<string, { id: string; userId: string }[]>();
  for (const t of openTrades as any[]) {
    const symbol = t.entry.ticker;
    const arr = bySymbol.get(symbol) ?? [];
    arr.push({ id: String(t._id), userId: String(t.userId) });
    bySymbol.set(symbol, arr);
  }

  const niftyCandles = await getRecentCandles("NIFTY");
  let updated = 0;
  const failedSymbols: string[] = [];

  for (const [symbol, trades] of bySymbol) {
    const candles = await getRecentCandles(symbol);
    if (candles.length < 2) {
      failedSymbols.push(symbol);
      continue;
    }
    const latest = candles[candles.length - 1];
    const prevBar = candles[candles.length - 2];
    const rsSeries = computeMansfieldRsSeries(candles, niftyCandles, 55);
    const markRs = rsSeries[rsSeries.length - 1] ?? null;

    for (const t of trades) {
      try {
        await updateOpenTradeMark(
          t.userId,
          t.id,
          latest.close,
          undefined,
          new Date(latest.date),
          prevBar.close,
          markRs,
        );
        updated++;
      } catch {
        // trade may have exited between the initial find and now — skip it
      }
    }
  }

  return { updated, symbols: bySymbol.size, failedSymbols };
}

/** Refresh an open trade's mark price (and quantity, if it changed). */
export async function updateOpenTradeMark(
  userId: string,
  id: string,
  markPrice: number,
  quantity?: number,
  markDate?: Date,
  prevClose?: number,
  markRs?: number | null,
): Promise<JournalTradeResponse> {
  const update: Record<string, unknown> = {
    markPrice,
    markUpdatedAt: new Date(),
    markDate: markDate ?? null,
    markPrevClose: prevClose ?? null,
    markRs: markRs ?? null,
  };
  if (quantity != null) {
    update.quantity = quantity;
    update.qty = quantity;
    update["entry.quantity"] = quantity;
  }
  const trade = await JournalOpen.findOneAndUpdate({ _id: id, userId }, update, {
    new: true,
  }).lean();
  if (!trade) throw AppError.notFound("Open trade not found");
  return formatTrade(trade);
}

/** Tag a trade as system-following or discretionary (works open or closed). */
export async function setRuleAdherence(
  userId: string,
  id: string,
  input: SetAdherenceInput,
): Promise<JournalTradeResponse> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) throw AppError.notFound("Trade not found");
  doc.set("ruleAdherence", input.ruleAdherence);
  doc.set("ruleAdherenceNote", input.ruleAdherenceNote ?? null);
  await doc.save();
  return formatTrade(doc.toObject());
}

/** Save the trader's own edit to the review note (works open or closed). */
export async function setReviewNote(
  userId: string,
  id: string,
  input: SetReviewNoteInput,
): Promise<JournalTradeResponse> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) throw AppError.notFound("Trade not found");
  doc.set("reviewNote", input.text);
  doc.set("reviewNoteSource", "user");
  doc.set("reviewNoteUpdatedAt", new Date());
  await doc.save();
  return formatTrade(doc.toObject());
}

/**
 * AI drafts (no note yet) or refines (a note already exists) the review
 * note in place — works on open or closed trades, unlike the formal
 * rules-adherence review which only makes sense once a trade is closed.
 */
export async function generateReviewNoteDraft(
  userId: string,
  id: string,
): Promise<JournalTradeResponse> {
  const doc = await findEitherDoc(userId, id);
  if (!doc) throw AppError.notFound("Trade not found");

  const entry = doc.entry as Record<string, any>;
  const exit = doc.exit as Record<string, any> | null;
  const existingNote = (doc as any).reviewNote ?? null;
  const tradeInsight = (doc as any).tradeInsight?.text ?? null;

  const text = await fetchReviewNoteDraft({
    symbol: entry.ticker,
    direction: entry.direction,
    entryDate: new Date(entry.entryDate).toISOString(),
    entryPrice: entry.entryPrice,
    quantity: entry.quantity,
    isClosed: !!exit,
    exitDate: exit ? new Date(exit.exitDate).toISOString() : null,
    exitPrice: exit?.exitPrice ?? null,
    outcome: doc.outcome,
    existingNote,
    tradeInsight,
  });

  doc.set("reviewNote", text);
  doc.set("reviewNoteSource", "ai");
  doc.set("reviewNoteUpdatedAt", new Date());
  await doc.save();
  return formatTrade(doc.toObject());
}
