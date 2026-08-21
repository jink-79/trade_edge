import mongoose from "mongoose";
import { JournalOpen, JournalClosed } from "./journal.model";
import { AppError } from "../../utils/api-error";
import { computeEntryIndicators, computeRegime } from "./journal.compute";
import { analyzeTradePath } from "./journal.analytics";
import { getPreferences } from "../preferences/preferences.service";
import { getRecentCandles, getSymbolMeta } from "../../config/phalanx-ohlcv";
import { fetchPositionAiReview } from "./journal.ai-review";
import type {
  AnalyzeTradeInput,
  AutoCaptureInput,
  CreateJournalTradeInput,
  ExitJournalTradeInput,
  JournalTradeResponse,
  ManualEntryInput,
  ReviewJournalTradeInput,
  SetAdherenceInput,
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
    markPrice: doc.markPrice ?? null,
    markUpdatedAt: doc.markUpdatedAt ?? null,
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
  return {
    pnlAmount,
    pnlPercent: invested > 0 ? round2((pnlAmount / invested) * 100) : 0,
    rMultiple: risk > 0 ? round2(pnlPerShare / risk) : null,
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

export async function autoCreateJournalTrade(
  userId: string,
  input: AutoCaptureInput,
): Promise<JournalTradeResponse> {
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
    rs55Pct: input.rs55Pct ?? null,
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

/**
 * Records the exit and MOVES the trade from openpositions → closedpositions,
 * computing realised P&L / R (stored flat for dashboard & analytics). Atomic.
 */
export async function exitJournalTrade(
  userId: string,
  id: string,
  input: ExitJournalTradeInput,
): Promise<JournalTradeResponse> {
  const open: any = await JournalOpen.findOne({ _id: id, userId }).lean();
  if (!open) throw AppError.notFound("Open trade not found");

  const exit = {
    outcome: input.outcome,
    exitPrice: input.exitPrice,
    exitDate: input.exitDate,
    manualExitReason: input.manualExitReason ?? null,
    stopWickedThenRecovered: input.stopWickedThenRecovered ?? null,
    targetTaggedThenReversed: input.targetTaggedThenReversed ?? null,
    maxAdverseExcursion: input.maxAdverseExcursion ?? null,
    screenshot: input.screenshot ?? null,
    aiAnalysis: input.aiAnalysis ?? null,
  };
  const metrics = computeExitMetrics(open.entry, exit);

  const closedDoc = {
    _id: open._id,
    userId: open.userId,
    tradeNumber: open.tradeNumber,
    entry: open.entry,
    exit,
    outcome: input.outcome,
    dataQuality: open.dataQuality,
    dataQualityNote: open.dataQualityNote ?? null,
    source: open.source,
    needsReview: false,
    gttPlaced: open.gttPlaced,
    createdAt: open.createdAt,
    ...entryMirror(open.entry),
    exitPrice: exit.exitPrice,
    exitDate: exit.exitDate,
    exitReason: exit.outcome,
    pnlAmount: metrics.pnlAmount,
    pnlPercent: metrics.pnlPercent,
    rMultiple: metrics.rMultiple,
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await JournalClosed.create([closedDoc], { session });
      await JournalOpen.deleteOne({ _id: id }, { session });
    });
  } finally {
    await session.endSession();
  }

  const created = await JournalClosed.findById(id).lean();
  return formatTrade(created);
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

/** All open trades for a user, raw (used by broker-sync to diff against Kite). */
export async function getOpenJournalTrades(userId: string) {
  return JournalOpen.find({ userId }).select(LIST_PROJECTION).lean();
}

/** A single open trade by symbol, or null — broker-sync's create-vs-update check. */
export async function findOpenJournalTradeBySymbol(userId: string, symbol: string) {
  return JournalOpen.findOne({ userId, symbol: symbol.toUpperCase() });
}

/** Closed trades whose exitDate falls within [start, end) — for the daily P&L snapshot. */
export async function getJournalTradesClosedBetween(userId: string, start: Date, end: Date) {
  return JournalClosed.find({ userId, exitDate: { $gte: start, $lt: end } })
    .select(LIST_PROJECTION)
    .lean();
}

/** Broker-sync: refresh an open trade's live mark (and quantity, if it changed in Kite). */
export async function updateOpenTradeMark(
  userId: string,
  id: string,
  markPrice: number,
  quantity?: number,
): Promise<JournalTradeResponse> {
  const update: Record<string, unknown> = { markPrice, markUpdatedAt: new Date() };
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
