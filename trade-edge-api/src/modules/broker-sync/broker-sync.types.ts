import { z } from "zod";
import { CandleSchema } from "../journal/journal.types";

/**
 * The Kite side of this sync happens outside trade-edge-api entirely (a
 * Claude session with the Kite MCP tools, or a future scheduled job) — this
 * module only accepts the resulting plain-JSON snapshot. trade-edge-api
 * never talks to Kite or stores broker credentials. See
 * docs/architecture/broker-sync.md.
 */

export const KitePositionSchema = z.object({
  symbol: z.string().min(1).max(20).trim().toUpperCase(),
  quantity: z.number().positive(),
  avgPrice: z.number().positive(),
  ltp: z.number().positive(),
  // RS-55 reading at entry, when the caller can cross-reference the matching
  // algo-signals daily_signals doc for this symbol/date.
  rs55Pct: z.number().optional(),
});

const SymbolCandlesSchema = z.object({
  candles: z.array(CandleSchema).min(2),
  indexCandles: z.array(CandleSchema).default([]),
});

export const KiteSyncSchema = z.object({
  positions: z.array(KitePositionSchema),
  // only needed for symbols with no existing open journal trade
  candlesBySymbol: z.record(z.string(), SymbolCandlesSchema).default({}),
});

export type KiteSyncInput = z.infer<typeof KiteSyncSchema>;

// ── Response types ────────────────────────────────────────────────────────────

export interface DailyPnlPosition {
  id: string | null;
  symbol: string;
  quantity: number;
  entryPrice: number;
  markPrice: number | null;
  unrealizedPnl: number;
  /** Day-over-day move (today's mark vs yesterday's close) — distinct from
   * unrealizedPnl, which is since-entry. Null with no prior close yet. */
  todayPnl: number | null;
}

export interface DailyPnlClosedTrade {
  id: string | null;
  symbol: string;
  exitPrice: number;
  pnlAmount: number;
}

export interface DailyPnlSnapshotResponse {
  date: string;
  openPositions: DailyPnlPosition[];
  unrealizedPnlTotal: number;
  /** Sum of todayPnl across open positions — the real "today" half of the
   * headline total (paired with realizedPnlTotal, not unrealizedPnlTotal). */
  todayPnlTotal: number;
  closedToday: DailyPnlClosedTrade[];
  realizedPnlTotal: number;
  totalPnl: number;
  availableCash: number;
  generatedAt: string;
}

export interface KiteSyncResult {
  created: string[];
  updated: string[];
  closed: string[];
  snapshot: DailyPnlSnapshotResponse;
}
