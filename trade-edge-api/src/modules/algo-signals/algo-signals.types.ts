/**
 * Mirrors the document shapes written by phalanx-live (a separate repo) into
 * its own Atlas cluster. TradeEdge only reads these — never validates them
 * strictly (no Zod here) since we don't control or write the source data;
 * components render defensively against missing/extra fields instead.
 */

export interface BuyCandidate {
  symbol: string;
  rs55_pct: number;
}

export interface SizedBuy {
  symbol: string;
  ref_price: number;
  qty: number;
  amount: number;
}

export interface DailySignalDoc {
  reference_date: string;
  generated_at: string;
  held_before: string[];
  exits: string[];
  capital: number;
  max_positions: number;
  slot_size: number;
  free_slots_after_exits: number;
  to_buy_sized: SizedBuy[];
  buy_candidates_ranked: BuyCandidate[];
  to_buy: string[];
  stale_symbols: string[];
}

export interface WeeklyBuyCandidate {
  symbol: string;
  breakout_strength_pct: number;
}

export interface WeeklySignalDoc {
  reference_week: string;
  generated_at: string;
  held_before: string[];
  exits: string[];
  capital: number;
  max_positions: number;
  slot_size: number;
  free_slots_after_exits: number;
  buy_candidates_ranked: WeeklyBuyCandidate[];
  to_buy: string[];
  stale_symbols: string[];
}
