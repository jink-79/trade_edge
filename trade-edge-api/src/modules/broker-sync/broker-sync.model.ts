import { Schema, model } from "mongoose";

/**
 * One doc per (userId, date), upserted — same shape philosophy as
 * phalanx-live's daily_signals (see docs/architecture/algo-signals.md):
 * a full snapshot of that day's book, not an incremental diff.
 */

const SnapshotPositionSchema = new Schema(
  {
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    markPrice: { type: Number, default: null },
    unrealizedPnl: { type: Number, required: true },
  },
  { _id: false },
);

const SnapshotClosedTradeSchema = new Schema(
  {
    symbol: { type: String, required: true },
    exitPrice: { type: Number, required: true },
    pnlAmount: { type: Number, required: true },
  },
  { _id: false },
);

export interface IDailyPnlSnapshot {
  userId: string;
  date: Date; // midnight UTC of the snapshot day — the (userId, date) key
  openPositions: { symbol: string; quantity: number; entryPrice: number; markPrice: number | null; unrealizedPnl: number }[];
  unrealizedPnlTotal: number;
  closedToday: { symbol: string; exitPrice: number; pnlAmount: number }[];
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
