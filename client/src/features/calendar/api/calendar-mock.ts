import type { TradeEvent } from "../types/calendar.types";

/** Placeholder events, plotted onto whatever month is displayed (all day
 * numbers stay <= 28 so they land in every month). Replaced once the
 * backend endpoint exists. */
export const MOCK_CALENDAR_EVENTS: TradeEvent[] = [
  { id: "e1", day: 2, kind: "entry", symbol: "RELIANCE", title: "Bought 25 @ ₹2,940", time: "09:42" },
  { id: "e2", day: 3, kind: "earnings", symbol: "TCS", title: "TCS earnings AMC", meta: "Held: 40" },
  { id: "e3", day: 5, kind: "exit", symbol: "ZOMATO", title: "Sold 800 @ ₹224", pnl: 6400, time: "14:18" },
  { id: "e4", day: 5, kind: "ai", title: "Edge AI: Win rate dips on Thu PM" },
  { id: "e5", day: 8, kind: "entry", symbol: "SOLARINDS", title: "Bought 5 @ ₹9,340", time: "10:05" },
  { id: "e6", day: 10, kind: "note", symbol: "HDFCBANK", title: "Added journal note", meta: "Pinned" },
  { id: "e7", day: 11, kind: "exit", symbol: "INFY", title: "Sold 80 @ ₹1,612", pnl: -1840, time: "11:23" },
  { id: "e8", day: 12, kind: "dividend", symbol: "ITC", title: "Dividend ₹620 credited" },
  { id: "e9", day: 15, kind: "entry", symbol: "TATAPOWER", title: "Bought 200 @ ₹462", time: "09:30" },
  { id: "e10", day: 17, kind: "earnings", symbol: "WIPRO", title: "Wipro earnings BMO" },
  { id: "e11", day: 18, kind: "exit", symbol: "BAJFINANCE", title: "Sold 12 @ ₹7,210", pnl: 4280, time: "13:55" },
  { id: "e12", day: 18, kind: "exit", symbol: "ADANIENT", title: "Sold 30 @ ₹2,810", pnl: 2100 },
  { id: "e13", day: 22, kind: "entry", symbol: "ZOMATO", title: "Bought 1200 @ ₹216", time: "10:11" },
  { id: "e14", day: 24, kind: "note", title: "Weekly review" },
  { id: "e15", day: 25, kind: "exit", symbol: "SOLARINDS", title: "Partial 2/5 @ ₹9,980", pnl: 1280, time: "14:42" },
  { id: "e16", day: 26, kind: "earnings", symbol: "INFY", title: "Infy Q1 in 2 days", meta: "Hold check" },
  { id: "e17", day: 28, kind: "entry", symbol: "HCLTECH", title: "Bought 60 @ ₹1,480", time: "10:48" },
];
