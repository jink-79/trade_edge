// ── Calendar response type ────────────────────────────────────────────────────
// GET /api/calendar?year=&month= (month is 0-indexed, matching JS Date)

/** Only kinds actually backed by journal data — entries and exits both carry
 * a real, reliable date. Earnings/dividends/notes would need a data source
 * this app doesn't have yet, so they aren't emitted here. */
export type CalendarEventKind = "entry" | "exit";

export interface CalendarEvent {
  id: string;
  day: number; // 1..31, within the requested month
  kind: CalendarEventKind;
  symbol?: string;
  title: string;
  pnl?: number;
  /** Capital exited (entryPrice × exited qty) — only on 'exit' events, so a
   * day's blended % return can be computed as sum(pnl) / sum(capital), the
   * same basis every benchmark index's own % return uses. */
  capital?: number;
  time?: string;
}

export interface CalendarResponse {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
}

// ── Benchmark comparison ("beat count") ─────────────────────────────────────

/** Broad-market NSE indices phalanx-live force-tracks daily OHLCV for
 * (update_daily.py's BENCHMARK_INDICES) — never a stock buy-candidate,
 * purely for this returns-vs-index comparison. */
export const BENCHMARK_INDICES = [
  "NIFTY",
  "BANKNIFTY",
  "NIFTYNEXT50",
  "NIFTY500",
  "NIFTYMIDCAP100",
  "NIFTYSMLCAP100",
] as const;

export interface CalendarDayBenchmark {
  day: number; // 1..31
  date: string; // ISO
  /** Day-over-day (prior trading day close → this close) % return per
   * index. A symbol is absent if phalanx-live doesn't have both bars yet. */
  returns: Record<string, number>;
}

export interface CalendarBenchmarkResponse {
  year: number;
  month: number;
  indices: readonly string[];
  days: CalendarDayBenchmark[];
}
