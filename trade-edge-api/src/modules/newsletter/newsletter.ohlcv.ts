import { Schema } from "mongoose";
import { phalanxConnection } from "../../config/phalanx-db";

/**
 * Read-only view of phalanx-live's `ohlcv` collection (same cluster/db
 * algo-signals already reads) — just enough to get a symbol's last two daily
 * closes for the newsletter's "today's move" figure. Never written to here.
 */
export interface OhlcvBar {
  symbol: string;
  timeframe: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const OhlcvSchema = new Schema<OhlcvBar>(
  {},
  { strict: false, versionKey: false, collection: "ohlcv" },
);

export const Ohlcv = phalanxConnection
  ? phalanxConnection.model<OhlcvBar>("Ohlcv", OhlcvSchema)
  : null;

/** Today's close and the prior trading day's close, for one symbol. Either
 * may be null if there isn't enough history yet. */
export async function getTodayAndPrevClose(
  symbol: string,
): Promise<{ today: OhlcvBar | null; prev: OhlcvBar | null }> {
  if (!Ohlcv) return { today: null, prev: null };
  const bars = await Ohlcv.find({ symbol, timeframe: "daily" })
    .sort({ date: -1 })
    .limit(2)
    .lean();
  return { today: bars[0] ?? null, prev: bars[1] ?? null };
}
