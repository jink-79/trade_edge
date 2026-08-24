/* ─────────────────────────────────────────────────────
   TRADE CALENDAR
   Only entry/exit are backed by real journal data — earnings,
   dividends and notes would need a data source this app doesn't have
   yet, so the backend (GET /api/calendar) only emits these two kinds.
───────────────────────────────────────────────────── */

export type EventKind = "entry" | "exit";

export interface TradeEvent {
  id: string;
  day: number; // 1..31, within the active month
  kind: EventKind;
  symbol?: string;
  title: string;
  pnl?: number;
  /** Capital exited — only on 'exit' events. Lets the calendar compute a
   * day's blended % return (sum pnl / sum capital) to compare against
   * index returns. */
  capital?: number;
  time?: string;
}

export interface CalendarResponse {
  year: number;
  month: number; // 0-indexed
  events: TradeEvent[];
}

// ── Benchmark comparison ("beat count") ─────────────────────────────────────

export const BENCHMARK_INDICES = [
  "NIFTY",
  "BANKNIFTY",
  "NIFTYNEXT50",
  "NIFTY500",
  "NIFTYMIDCAP100",
  "NIFTYSMLCAP100",
] as const;

export const INDEX_LABEL: Record<string, string> = {
  NIFTY: "Nifty 50",
  BANKNIFTY: "Nifty Bank",
  NIFTYNEXT50: "Nifty Next 50",
  NIFTY500: "Nifty 500",
  NIFTYMIDCAP100: "Nifty Midcap 100",
  NIFTYSMLCAP100: "Nifty Smallcap 100",
};

export interface CalendarDayBenchmark {
  day: number;
  date: string;
  returns: Record<string, number>;
}

export interface CalendarBenchmarkResponse {
  year: number;
  month: number;
  indices: readonly string[];
  days: CalendarDayBenchmark[];
}
