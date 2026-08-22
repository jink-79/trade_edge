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
  time?: string;
}

export interface CalendarResponse {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
}
