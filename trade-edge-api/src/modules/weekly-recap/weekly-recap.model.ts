import { Schema, model } from "mongoose";

/**
 * Only the AI narrative is persisted here — entries/exits/stats are cheap
 * to recompute live from the journal collections on every read (same
 * philosophy as dashboard.service.ts), so there's nothing to keep in sync.
 * One doc per (userId, weekStart), upserted when the AI summary is
 * (re)generated.
 */

export interface IWeeklyRecap {
  userId: string;
  weekStart: Date; // Monday 00:00 UTC — the (userId, weekStart) key
  aiSummary: string | null;
  aiSummaryGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyRecapSchema = new Schema<IWeeklyRecap>(
  {
    userId: { type: String, required: true, index: true },
    weekStart: { type: Date, required: true },
    aiSummary: { type: String, default: null },
    aiSummaryGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
WeeklyRecapSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyRecap = model<IWeeklyRecap>(
  "WeeklyRecap",
  WeeklyRecapSchema,
  "weekly_recaps",
);
