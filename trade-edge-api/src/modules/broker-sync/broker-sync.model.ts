import { Schema, model } from "mongoose";

/**
 * One doc per (userId, date), upserted — same shape philosophy as
 * phalanx-live's daily_signals (see docs/architecture/algo-signals.md):
 * a full snapshot of that day's book, not an incremental diff.
 */

const SnapshotPositionSchema = new Schema(
  {
    id: { type: String, default: null }, // journal trade id, for linking to /trades/:id
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    markPrice: { type: Number, default: null },
    unrealizedPnl: { type: Number, required: true },
    // Day-over-day move (today's mark vs yesterday's close) — distinct from
    // unrealizedPnl, which is since-entry. Null when there's no prior close
    // yet (first day of tracking).
    todayPnl: { type: Number, default: null },
  },
  { _id: false },
);

const SnapshotClosedTradeSchema = new Schema(
  {
    id: { type: String, default: null }, // journal trade id, for linking to /trades/:id
    symbol: { type: String, required: true },
    exitPrice: { type: Number, required: true },
    pnlAmount: { type: Number, required: true },
  },
  { _id: false },
);

export interface IDailyPnlSnapshot {
  userId: string;
  date: Date; // midnight UTC of the snapshot day — the (userId, date) key
  openPositions: {
    id: string | null;
    symbol: string;
    quantity: number;
    entryPrice: number;
    markPrice: number | null;
    unrealizedPnl: number;
    todayPnl: number | null;
  }[];
  unrealizedPnlTotal: number;
  todayPnlTotal: number;
  closedToday: { id: string | null; symbol: string; exitPrice: number; pnlAmount: number }[];
  realizedPnlTotal: number;
  totalPnl: number;
  availableCash: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyPnlSnapshotSchema = new Schema<IDailyPnlSnapshot>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    openPositions: { type: [SnapshotPositionSchema], default: [] },
    unrealizedPnlTotal: { type: Number, required: true },
    todayPnlTotal: { type: Number, default: 0 },
    closedToday: { type: [SnapshotClosedTradeSchema], default: [] },
    realizedPnlTotal: { type: Number, required: true },
    totalPnl: { type: Number, required: true },
    availableCash: { type: Number, required: true },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true },
);
DailyPnlSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyPnlSnapshot = model<IDailyPnlSnapshot>(
  "DailyPnlSnapshot",
  DailyPnlSnapshotSchema,
  "daily_pnl_snapshots",
);
