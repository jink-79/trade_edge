import { ScannerBatch, ScannerSignal, ScannerPerformance } from "./scanner.model";
import { AppError } from "../../utils/api-error";
import { computeEntryIndicators, computeRegime } from "../journal/journal.compute";
import { computeSupportFeatures } from "../journal/journal.support";
import { simulateExits } from "../journal/journal.exits";
import type { Candle } from "../journal/journal.compute";
import { getPreferences } from "../preferences/preferences.service";
import {
  MAX_HOLD_DAYS,
  type CreateBatchInput,
  type EnrichSignalInput,
  type ListSignalsQuery,
  type SavePerformanceInput,
  type UploadSignalsInput,
} from "./scanner.types";

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── formatting ────────────────────────────────────────────────────────────────

function formatSignal(doc: any) {
  return {
    id: String(doc._id),
    batchId: doc.batchId ? String(doc.batchId) : null,
    symbol: doc.symbol,
    scanDate: doc.scanDate,
    scanName: doc.scanName ?? "all-cash",
    sector: doc.sector ?? null,
    marketCap: doc.marketCap ?? null,
    status: doc.status,
    entry: doc.entry ?? null,
    tracking: doc.tracking ?? null,
    result: doc.result ?? null,
    exits: doc.exits ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// ── candle helpers ──────────────────────────────────────────────────────────────

/** Index of the scan-day candle: exact date, else the last bar on/before it. */
function idxOnOrBefore(candles: Candle[], iso: string): number {
  const day = iso.slice(0, 10);
  const exact = candles.findIndex((c) => c.date.slice(0, 10) === day);
  if (exact !== -1) return exact;
  const t = new Date(iso).getTime();
  let idx = candles.length - 1;
  for (let i = 0; i < candles.length; i++) {
    if (new Date(candles[i].date).getTime() <= t) idx = i;
    else break;
  }
  return idx;
}

/**
 * Walk daily candles forward from the day AFTER entry. LONG-only (mean-reversion
 * buys). Resolves TARGET/STOP/TIMEOUT, else OPEN if not enough forward candles.
 */
function resolveSignal(
  candles: Candle[],
  eIdx: number,
  entryPrice: number,
  target: number,
  stop: number,
  risk: number,
) {
  let mae = 0;
  let mfe = 0;
  const lastAvail = candles.length - 1;
  const windowEnd = Math.min(lastAvail, eIdx + MAX_HOLD_DAYS);

  const build = (
    status: string,
    exitPrice: number,
    exitIdx: number,
  ) => {
    const pps = exitPrice - entryPrice;
    return {
      status,
      tracking: {
        lastPrice: round2(exitPrice),
        lastDate: candles[exitIdx].date,
        mae: round2(mae),
        mfe: round2(mfe),
        daysHeld: exitIdx - eIdx,
      },
      result: {
        outcome: status,
        exitPrice: round2(exitPrice),
        exitDate: candles[exitIdx].date,
        daysToResolve: exitIdx - eIdx,
        rMultiple: risk > 0 ? round2(pps / risk) : null,
        maeR: risk > 0 ? round2(mae / risk) : null,
        mfeR: risk > 0 ? round2(mfe / risk) : null,
      },
    };
  };

  for (let i = eIdx + 1; i <= windowEnd; i++) {
    const c = candles[i];
    mfe = Math.max(mfe, c.high - entryPrice);
    mae = Math.max(mae, entryPrice - c.low);
    if (c.low <= stop) return build("STOP", stop, i);
    if (c.high >= target) return build("TARGET", target, i);
  }

  // Not hit within the window.
  const fullWindowElapsed = lastAvail >= eIdx + MAX_HOLD_DAYS;
  if (fullWindowElapsed) return build("TIMEOUT", candles[windowEnd].close, windowEnd);

  // Still open — waiting for more forward candles.
  return {
    status: "OPEN",
    tracking: {
      lastPrice: round2(candles[windowEnd].close),
      lastDate: candles[windowEnd].date,
      mae: round2(mae),
      mfe: round2(mfe),
      daysHeld: windowEnd - eIdx,
    },
    result: null,
  };
}

// ── operations ──────────────────────────────────────────────────────────────────

export async function createBatch(userId: string, input: CreateBatchInput) {
  const symbols = Array.from(new Set(input.symbols)); // de-dup within the paste

  const batch = await ScannerBatch.create({
    userId,
    scanDate: input.scanDate,
    source: "chartink",
    rawInput: input.rawInput ?? null,
    symbolCount: symbols.length,
    note: input.note ?? null,
  });

  // One signal per (user, symbol, scanDate); re-pasting the same night is a no-op.
  await ScannerSignal.bulkWrite(
    symbols.map((symbol) => ({
      updateOne: {
        filter: { userId, scanName: input.scanName, symbol, scanDate: input.scanDate },
        update: {
          $setOnInsert: {
            userId,
            scanName: input.scanName,
            symbol,
            scanDate: input.scanDate,
            batchId: batch._id,
            status: "OPEN",
            sector: null,
            entry: null,
            tracking: null,
            result: null,
          },
        },
        upsert: true,
      },
    })),
  );

  const created = await ScannerSignal.countDocuments({
    userId,
    scanDate: input.scanDate,
  });
  return { batchId: String(batch._id), scanDate: input.scanDate, symbols: symbols.length, tracked: created };
}

/**
 * Bulk-ingest a Chartink backtest export (many dates). Upserts one signal per
 * (user, symbol, scanDate); sector + marketCap are always written (backfilling
 * existing signals too). Existing enriched signals keep their entry/result.
 */
export async function uploadSignals(userId: string, input: UploadSignalsInput) {
  const rows = input.rows;
  const dates = new Set(rows.map((r) => new Date(r.scanDate).toISOString().slice(0, 10)));
  const symbols = new Set(rows.map((r) => r.symbol));

  const minDate = rows.reduce(
    (m, r) => (r.scanDate < m ? r.scanDate : m),
    rows[0].scanDate,
  );
  const batch = await ScannerBatch.create({
    userId,
    scanDate: minDate,
    source: input.source,
    rawInput: null,
    symbolCount: symbols.size,
    note: input.note ?? `Bulk upload · ${rows.length} rows · ${dates.size} dates`,
  });

  // De-dup identical (symbol, scanDate) rows within the file.
  const seen = new Set<string>();
  const ops = [];
  for (const r of rows) {
    const day = new Date(r.scanDate).toISOString().slice(0, 10);
    const key = `${r.symbol}|${day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ops.push({
      updateOne: {
        filter: {
          userId,
          scanName: input.scanName,
          symbol: r.symbol,
          scanDate: r.scanDate,
        },
        update: {
          $set: {
            sector: r.sector ?? null,
            marketCap: r.marketCap ?? null,
          },
          $setOnInsert: {
            userId,
            scanName: input.scanName,
            symbol: r.symbol,
            scanDate: r.scanDate,
            batchId: batch._id,
            status: "OPEN",
            entry: null,
            tracking: null,
            result: null,
          },
        },
        upsert: true,
      },
    });
  }

  // Chunk the bulk write to keep each op batch reasonable.
  let upserted = 0;
  for (let i = 0; i < ops.length; i += 1000) {
    const res = await ScannerSignal.bulkWrite(ops.slice(i, i + 1000), {
      ordered: false,
    });
    upserted += res.upsertedCount ?? 0;
  }

  const tracked = await ScannerSignal.countDocuments({ userId });
  return {
    batchId: String(batch._id),
    rows: rows.length,
    dates: dates.size,
    symbols: symbols.size,
    newSignals: upserted,
    tracked,
  };
}

export async function listSignals(userId: string, q: ListSignalsQuery) {
  const filter: Record<string, unknown> = { userId };
  if (q.status) filter.status = q.status;
  if (q.batchId) filter.batchId = q.batchId;
  if (q.scanName) filter.scanName = q.scanName;
  if (q.date) {
    const d = new Date(q.date);
    const next = new Date(d);
    next.setUTCDate(d.getUTCDate() + 1);
    filter.scanDate = { $gte: d, $lt: next };
  }
  const docs = await ScannerSignal.find(filter)
    .sort({ scanDate: -1, symbol: 1 })
    .lean();
  return docs.map(formatSignal);
}

/** Signals still needing candles (the Python courier reads this list). */
export async function listActiveSignals(userId: string) {
  const docs = await ScannerSignal.find({ userId, status: "OPEN" })
    .sort({ scanDate: 1 })
    .lean();
  return docs.map(formatSignal);
}

type Prefs = Awaited<ReturnType<typeof getPreferences>>;
type Candles = EnrichSignalInput["candles"];

/** Compute entry snapshot + resolution for one signal doc, then save it. */
async function applyEnrichment(
  sig: any,
  candles: Candles,
  indexCandles: Candles,
  prefs: Prefs,
) {
  const scanDateIso = new Date(sig.scanDate).toISOString();
  const eIdx = idxOnOrBefore(candles, scanDateIso);
  const entryCandle = candles[eIdx];
  const entryPrice = entryCandle.close;

  const ind = computeEntryIndicators(candles, entryPrice, scanDateIso, prefs.atrPeriod);
  // Regime AS OF the scan date — not the latest bar (that made every signal "down").
  const niftyIdx = indexCandles.length
    ? idxOnOrBefore(indexCandles, scanDateIso)
    : -1;
  const regime = computeRegime(
    niftyIdx >= 0 ? indexCandles.slice(0, niftyIdx + 1) : indexCandles,
  );

  const targetPrice = round2(entryPrice + prefs.targetAtrMultiplier * ind.atr14);
  const stopPrice = round2(entryPrice - prefs.slAtrMultiplier * ind.atr14);
  const risk = entryPrice - stopPrice;
  const support = computeSupportFeatures(candles, eIdx, ind.atr14);

  sig.set("entry", {
    entryDate: entryCandle.date,
    entryPrice: round2(entryPrice),
    atr14: ind.atr14,
    targetPrice,
    stopPrice,
    rsi2: ind.rsi2,
    distanceFrom200Ema: ind.distanceFrom200Ema,
    distanceTo50Ema: ind.distanceTo50Ema,
    pullbackDepth: ind.pullbackDepth,
    candlesFromHigh: ind.candlesFromHigh,
    entryCandleClose: ind.entryCandleClose,
    downMoveVolume: ind.downMoveVolume,
    sector: sig.sector ?? "",
    niftyVs200Ema: regime.niftyVs200Ema,
    niftyRsi2: regime.niftyRsi2,
    gappedIntoEntry: ind.gappedIntoEntry,
    support,
  });
  sig.markModified("entry");

  // Simulate alternative exit rules (Connors 5-EMA, RSI>50, time-stop, …) on the
  // forward candles so the analyzer can compare exits on identical entries.
  sig.set(
    "exits",
    simulateExits(candles, eIdx, entryPrice, ind.atr14, prefs.slAtrMultiplier, prefs.targetAtrMultiplier),
  );
  sig.markModified("exits");

  // Resolve only if still open — a re-run refreshes entry features (incl. the
  // new support signals) on resolved trades WITHOUT changing their outcome.
  if (sig.status === "OPEN") {
    const res = resolveSignal(candles, eIdx, entryPrice, targetPrice, stopPrice, risk);
    sig.set("status", res.status);
    sig.set("tracking", res.tracking);
    sig.set("result", res.result);
    sig.markModified("tracking");
    sig.markModified("result");
  }
  await sig.save();
}

export async function enrichSignal(
  userId: string,
  id: string,
  input: EnrichSignalInput,
) {
  const sig = await ScannerSignal.findOne({ _id: id, userId });
  if (!sig) throw AppError.notFound("Signal not found");
  const prefs = await getPreferences(userId);
  await applyEnrichment(sig, input.candles, input.indexCandles, prefs);
  return formatSignal(sig.toObject());
}

/**
 * Enrich EVERY open signal for a symbol from one candle set — the bulk path.
 * The courier fetches a symbol's candles once and enriches all its dates in a
 * single request (2,500 tiny requests → ~700 fatter ones).
 */
export async function enrichBySymbol(
  userId: string,
  symbol: string,
  candles: Candles,
  indexCandles: Candles,
) {
  // ALL signals for the symbol — open ones resolve, resolved ones just get their
  // entry snapshot refreshed (so new features like support backfill).
  const sigs = await ScannerSignal.find({ userId, symbol });
  if (sigs.length === 0) return { symbol, enriched: 0, counts: {} };
  const prefs = await getPreferences(userId);
  const counts: Record<string, number> = {};
  for (const sig of sigs) {
    await applyEnrichment(sig, candles, indexCandles, prefs);
    counts[sig.status] = (counts[sig.status] ?? 0) + 1;
  }
  return { symbol, enriched: sigs.length, counts };
}

export async function getStats(userId: string) {
  const signals = await ScannerSignal.find({ userId }).lean();
  const resolved = signals.filter((s) => s.status !== "OPEN" && s.result);

  let target = 0;
  let stop = 0;
  let timeout = 0;
  let wins = 0;
  let rSum = 0;
  let rCount = 0;
  let daySum = 0;
  for (const s of resolved) {
    if (s.status === "TARGET") target++;
    else if (s.status === "STOP") stop++;
    else if (s.status === "TIMEOUT") timeout++;
    const r = (s.result as any)?.rMultiple;
    if (r != null) {
      rSum += r;
      rCount++;
      if (r > 0) wins++;
    }
    const d = (s.result as any)?.daysToResolve;
    if (typeof d === "number") daySum += d;
  }

  const n = resolved.length;
  return {
    total: signals.length,
    open: signals.filter((s) => s.status === "OPEN").length,
    resolved: n,
    targetPct: n ? round2((target / n) * 100) : 0,
    stopPct: n ? round2((stop / n) * 100) : 0,
    timeoutPct: n ? round2((timeout / n) * 100) : 0,
    winRate: n ? round2((wins / n) * 100) : 0,
    avgR: rCount ? round2(rSum / rCount) : null,
    expectancy: rCount ? round2(rSum / rCount) : null,
    avgDaysToResolve: n ? round2(daySum / n) : 0,
  };
}

// ── Backtest performance snapshot ─────────────────────────────────────────────

function formatPerformance(doc: any) {
  return {
    asOf: doc.asOf,
    computedAt: doc.updatedAt,
    config: doc.config ?? null,
    metrics: doc.metrics ?? null,
    equityCurve: doc.equityCurve ?? [],
    monthlyReturns: doc.monthlyReturns ?? [],
    benchmarkCurve: doc.benchmarkCurve ?? [],
    tradeCount: doc.tradeCount ?? 0,
    sampleWarning: doc.sampleWarning ?? null,
  };
}

export async function savePerformance(
  userId: string,
  input: SavePerformanceInput,
) {
  const doc = await ScannerPerformance.findOneAndUpdate(
    { userId },
    {
      userId,
      asOf: input.asOf ?? new Date(),
      config: input.config ?? null,
      metrics: input.metrics,
      equityCurve: input.equityCurve,
      monthlyReturns: input.monthlyReturns,
      benchmarkCurve: input.benchmarkCurve,
      tradeCount: input.tradeCount,
      sampleWarning: input.sampleWarning ?? null,
    },
    { new: true, upsert: true },
  ).lean();
  return formatPerformance(doc);
}

export async function getPerformance(userId: string) {
  const doc = await ScannerPerformance.findOne({ userId }).lean();
  return doc ? formatPerformance(doc) : null;
}
