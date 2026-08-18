import { Model, Schema } from "mongoose";
import { phalanxConnection } from "../../config/phalanx-db";
import type { DailySignalDoc, WeeklySignalDoc } from "./algo-signals.types";

// `strict: false` — these documents are owned by phalanx-live (a separate
// repo); we render whatever fields show up rather than dropping unknown ones.
const DailySignalSchema = new Schema<DailySignalDoc>(
  {},
  { strict: false, versionKey: false, collection: "daily_signals" },
);

const WeeklySignalSchema = new Schema<WeeklySignalDoc>(
  {},
  { strict: false, versionKey: false, collection: "weekly_signals" },
);

// Both are null when PHALANX_ATLAS_MONGODB_URI/DB_NAME aren't configured —
// algo-signals.service guards every call with isPhalanxConfigured() first.
export const DailySignal: Model<DailySignalDoc> | null = phalanxConnection
  ? phalanxConnection.model<DailySignalDoc>("DailySignal", DailySignalSchema)
  : null;

export const WeeklySignal: Model<WeeklySignalDoc> | null = phalanxConnection
  ? phalanxConnection.model<WeeklySignalDoc>("WeeklySignal", WeeklySignalSchema)
  : null;
