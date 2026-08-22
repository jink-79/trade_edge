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

export interface KiteSyncResult {
  created: string[];
  updated: string[];
  closed: string[];
}
