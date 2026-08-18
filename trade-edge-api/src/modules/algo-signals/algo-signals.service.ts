import { AppError } from "../../utils/api-error";
import { connectPhalanxDB, isPhalanxConfigured } from "../../config/phalanx-db";
import { DailySignal, WeeklySignal } from "./algo-signals.model";
import type { DailySignalDoc, WeeklySignalDoc } from "./algo-signals.types";

async function ensurePhalanxReady(): Promise<void> {
  if (!isPhalanxConfigured()) {
    throw new AppError(
      "Algo Signals isn't configured on this deployment (PHALANX_ATLAS_MONGODB_URI / PHALANX_ATLAS_DB_NAME missing)",
      503,
    );
  }
  await connectPhalanxDB();
}

export interface DateRangeQuery {
  from?: string;
  to?: string;
  limit?: number;
}

export async function getLatestDailySignal(): Promise<DailySignalDoc | null> {
  await ensurePhalanxReady();
  return DailySignal!.findOne({}, { _id: 0 })
    .sort({ reference_date: -1 })
    .lean<DailySignalDoc>()
    .exec();
}

export async function listDailySignals(range: DateRangeQuery): Promise<DailySignalDoc[]> {
  await ensurePhalanxReady();
  const filter: Record<string, unknown> = {};
  if (range.from || range.to) {
    filter.reference_date = {
      ...(range.from ? { $gte: range.from } : {}),
      ...(range.to ? { $lte: range.to } : {}),
    };
  }
  return DailySignal!.find(filter, { _id: 0 })
    .sort({ reference_date: -1 })
    .limit(Math.min(range.limit ?? 60, 200))
    .lean<DailySignalDoc[]>()
    .exec();
}

export async function getLatestWeeklySignal(): Promise<WeeklySignalDoc | null> {
  await ensurePhalanxReady();
  return WeeklySignal!.findOne({}, { _id: 0 })
    .sort({ reference_week: -1 })
    .lean<WeeklySignalDoc>()
    .exec();
}

export async function listWeeklySignals(range: DateRangeQuery): Promise<WeeklySignalDoc[]> {
  await ensurePhalanxReady();
  const filter: Record<string, unknown> = {};
  if (range.from || range.to) {
    filter.reference_week = {
      ...(range.from ? { $gte: range.from } : {}),
      ...(range.to ? { $lte: range.to } : {}),
    };
  }
  return WeeklySignal!.find(filter, { _id: 0 })
    .sort({ reference_week: -1 })
    .limit(Math.min(range.limit ?? 60, 200))
    .lean<WeeklySignalDoc[]>()
    .exec();
}
