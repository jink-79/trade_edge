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
  time?: string;
}

export interface CalendarResponse {
  year: number;
  month: number; // 0-indexed
  events: TradeEvent[];
}
