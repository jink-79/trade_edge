/* ─────────────────────────────────────────────────────
   DATA CONTRACT — matches the Python weekly scanner
   GET /api/signals/weekly-scanner?weeks=8
   Response: ApiEnvelope<SignalsResponse>
───────────────────────────────────────────────────── */

/** Raw stock row from the weekly_entry_scanner collection. */
export interface SignalStock {
  symbol: string;
  close: number;
  breakout_level: number;
  volume: number;
  avg_volume_20: number;
}

/** One week's group of scanner signals. */
export interface WeeklySignal {
  week: string | null; // week_key, e.g. "2026-05-11"
  signalWeek: string; // label from signal_week
  count: number;
  stocks: SignalStock[];
}

export interface SignalsResponse {
  latestWeek: string | null;
  totalWeeks: number;
  data: WeeklySignal[];
}

/* ── client-enriched ── */

export type SignalStrength = "strong" | "moderate" | "weak";

export interface EnrichedSignal extends SignalStock {
  volumeRatio: number; // volume / avg_volume_20
  aboveBreakoutPct: number; // (close - breakout_level) / breakout_level * 100
  strength: SignalStrength; // derived from volumeRatio
}

export type SortCol =
  | "symbol"
  | "close"
  | "breakout_level"
  | "aboveBreakoutPct"
  | "volumeRatio";

export interface SortState {
  col: SortCol;
  dir: "asc" | "desc";
}
