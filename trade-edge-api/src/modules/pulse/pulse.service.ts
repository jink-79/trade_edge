import { PulseRun, PulsePerformance, PulseWeek, PulseSymbolStats, PulseTradeLogRow } from "./pulse.model";
import type {
  SavePulseScanInput,
  SavePulsePerformanceInput,
  SavePulseWeeksInput,
  SaveSymbolScorecardInput,
  SavePulseTradeLogInput,
} from "./pulse.types";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Upsert a weekend scan run (unique per user+variant+asOf). */
export async function savePulseScan(userId: string, input: SavePulseScanInput) {
  const { variant, asOf, ...rest } = input;
  const doc = await PulseRun.findOneAndUpdate(
    { userId, variant, asOf },
    { $set: { userId, variant, asOf, ...rest } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc;
}

/** Latest scan run for a user (optionally a specific variant). */
export async function getLatestScan(userId: string, variant?: string) {
  const query: Record<string, unknown> = { userId };
  if (variant) query.variant = variant;
  return PulseRun.findOne(query).sort({ asOf: -1, updatedAt: -1 }).lean();
}

/** Upsert a variant's backtest snapshot (unique per user+variant). */
export async function savePulsePerformance(
  userId: string,
  input: SavePulsePerformanceInput,
) {
  const { variant } = input;
  const doc = await PulsePerformance.findOneAndUpdate(
    { userId, variant },
    { $set: { userId, ...input } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc;
}

/** All backtest snapshots for a user (or one variant). */
export async function listPerformance(userId: string, variant?: string) {
  const query: Record<string, unknown> = { userId };
  if (variant) query.variant = variant;
  return PulsePerformance.find(query).sort({ variant: 1 }).lean();
}

/** Bulk-upsert a variant's per-week blotter timeline. */
export async function savePulseWeeks(userId: string, input: SavePulseWeeksInput) {
  const { variant, weeks, replace } = input;
  if (replace) {
    await PulseWeek.deleteMany({ userId, variant });
  }
  if (weeks.length) {
    const ops = weeks.map((w) => ({
      updateOne: {
        filter: { userId, variant, week: w.week },
        update: { $set: { userId, variant, ...w } },
        upsert: true,
      },
    }));
    await PulseWeek.bulkWrite(ops, { ordered: false });
  }
  return { variant, weeks: weeks.length };
}

/** Lightweight week summaries (no heavy arrays) — for the picker / week nav.
 * Optionally scoped to [from, to] so a wide-open "all weeks" view doesn't
 * pull a strategy's entire history in one call. */
export async function listWeeks(
  userId: string,
  variant?: string,
  range?: { from?: Date; to?: Date },
) {
  const query: Record<string, unknown> = { userId };
  if (variant) query.variant = variant;
  if (range?.from || range?.to) {
    query.week = {
      ...(range.from ? { $gte: range.from } : {}),
      ...(range.to ? { $lte: range.to } : {}),
    };
  }
  return PulseWeek.find(query)
    .select("week variant equity cash realizedPnl unrealizedPnl openValue counts -_id")
    .sort({ week: 1 })
    .lean();
}

/** The full blotter for the week containing `date` (snaps to the latest week ≤ date). */
export async function getWeekByDate(userId: string, date: Date, variant?: string) {
  const query: Record<string, unknown> = { userId, week: { $lte: date } };
  if (variant) query.variant = variant;
  return PulseWeek.findOne(query).sort({ week: -1 }).lean();
}

/** Upsert a universe's symbol scorecard snapshot (unique per user+variant+generatedAt). */
export async function saveSymbolStats(userId: string, input: SaveSymbolScorecardInput) {
  const { universe, generatedAt, ...rest } = input;
  const variant = universe;
  const doc = await PulseSymbolStats.findOneAndUpdate(
    { userId, variant, generatedAt },
    { $set: { userId, variant, generatedAt, ...rest } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc;
}

/** Latest symbol scorecard for a user + universe ("tracked" | "fno"). */
export async function getSymbolStats(userId: string, variant: string) {
  return PulseSymbolStats.findOne({ userId, variant })
    .sort({ generatedAt: -1, updatedAt: -1 })
    .lean();
}

/** Bulk-replace a variant's trade log (one document per trade, for pagination). */
export async function savePulseTradeLog(userId: string, input: SavePulseTradeLogInput) {
  const { variant, rows, replace } = input;
  if (replace) {
    await PulseTradeLogRow.deleteMany({ userId, variant });
  }
  if (rows.length) {
    const docs = rows.map((row) => ({
      userId,
      variant,
      symbol: row.Symbol,
      exitDate: row["Exit Date"] ? new Date(row["Exit Date"]) : null,
      row,
    }));
    await PulseTradeLogRow.insertMany(docs, { ordered: false });
  }
  return { variant, rows: rows.length };
}

/** Paginated, symbol-filterable trade log for a variant. */
export async function getPulseTradeLog(
  userId: string,
  variant: string,
  { page, pageSize, symbol }: { page: number; pageSize: number; symbol?: string },
) {
  const query: Record<string, unknown> = { userId, variant };
  if (symbol) query.symbol = new RegExp(escapeRegex(symbol), "i");

  const [total, docs] = await Promise.all([
    PulseTradeLogRow.countDocuments(query),
    PulseTradeLogRow.find(query)
      .sort({ exitDate: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("row -_id")
      .lean(),
  ]);

  return { total, page, pageSize, rows: docs.map((d) => d.row) };
}

/** Variant list with headline stats, for the side-by-side comparison panel. */
export async function listVariants(userId: string) {
  const snaps = await PulsePerformance.find({ userId })
    .sort({ variant: 1 })
    .lean();
  return snaps.map((s) => ({
    variant: s.variant,
    label: s.label,
    asOf: s.asOf,
    tradeCount: s.tradeCount,
    sampleWarning: s.sampleWarning,
    metrics: s.metrics,
  }));
}
