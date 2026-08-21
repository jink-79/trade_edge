import mongoose from "mongoose";
import { JournalOpen, JournalClosed } from "./journal.model";
import { AppError } from "../../utils/api-error";
import { computeEntryIndicators, computeRegime, computeRs55 } from "./journal.compute";
import { analyzeTradePath } from "./journal.analytics";
import { getPreferences } from "../preferences/preferences.service";
import { getRecentCandles, getSymbolMeta } from "../../config/phalanx-ohlcv";
import { logger } from "../../utils/logger";
import { fetchPositionAiReview } from "./journal.ai-review";
import { fetchExitSummary } from "./journal.exit-ai";
import { computeCharges } from "./journal.charges";
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
    needsReview: false,
    gttPlaced: open.gttPlaced,
    createdAt: isPartial ? new Date() : open.createdAt,
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
