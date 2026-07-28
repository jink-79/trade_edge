import mongoose from "mongoose";
import { JournalOpen, JournalClosed } from "./journal.model";
import { AppError } from "../../utils/api-error";
import { computeEntryIndicators, computeRegime } from "./journal.compute";
import { getPreferences } from "../preferences/preferences.service";
import type {
  AutoCaptureInput,
  CreateJournalTradeInput,
  ExitJournalTradeInput,
  JournalTradeResponse,
  ReviewJournalTradeInput,
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
    needsReview: doc.needsReview ?? false,
    gttPlaced: doc.gttPlaced ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
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

  const stopPrice =
    input.stopPrice ?? round2(input.entryPrice - slMult * ind.atr14);
  const targetPrice =
    input.targetPrice ?? round2(input.entryPrice + tgtMult * ind.atr14);

  const entry = {
    ticker: input.symbol,
    entryDate: input.entryDate,
    direction: input.direction,
    entryPrice: input.entryPrice,
    quantity: input.quantity,
    targetPrice,
    stopPrice,
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
    sector: input.sector ?? "Unknown",
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
    needsReview: true,
    ...entryMirror(entry),
  });

  return formatTrade(doc.toObject());
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
