/* ─────────────────────────────────────────────────────
   TRADE CALENDAR — UI-first types
   Mock data lives in ../api/calendar-mock.ts until the backend
   endpoint (GET /api/calendar?year=&month=) exists to replace it.
───────────────────────────────────────────────────── */

export type EventKind = "entry" | "exit" | "earnings" | "note" | "dividend" | "ai";

export interface TradeEvent {
  id: string;
  day: number; // 1..31, within the active month
  kind: EventKind;
  symbol?: string;
  title: string;
  meta?: string;
  pnl?: number;
  time?: string;
}
