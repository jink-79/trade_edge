import { PulseRun, PulsePerformance, PulseWeek } from "./pulse.model";
import type {
  SavePulseScanInput,
  SavePulsePerformanceInput,
  SavePulseWeeksInput,
} from "./pulse.types";

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

/** Lightweight week summaries (no heavy arrays) — for the picker / week nav. */
export async function listWeeks(userId: string, variant?: string) {
  const query: Record<string, unknown> = { userId };
  if (variant) query.variant = variant;
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
