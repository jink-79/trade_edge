/* ─────────────────────────────────────────────────────
   DATA CONTRACT
   ─────────────────────────────────────────────────────

   GET /api/analytics?range=YTD
   range: "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "All"

   Response: AnalyticsResponse
───────────────────────────────────────────────────── */

export const RANGES = ["1W", "1M", "3M", "6M", "YTD", "1Y", "All"] as const;
export type Range = (typeof RANGES)[number];

/* ── chart series ── */

export interface EquityPoint {
  d: string; // "Jan", "Feb" …
  you: number; // account value
  bench: number; // benchmark value
  dd: number; // drawdown %
}

export interface MonthlyReturn {
  m: string; // "Jan" …
  r: number; // return %
}

export interface RBucket {
  bucket: string; // "-3R", "-2R" … "+5R"
  n: number; // trade count
}

export interface SetupEdge {
  setup: string;
  trades: number;
  win: number; // win rate %
  exp: number; // expectancy in R
}

export interface SectorPerf {
  sector: string;
  pnl: number;
  trades: number;
}

export interface HourlyPnl {
  h: string; // "9:30", "10" …
  pnl: number;
}

export interface RadarPoint {
  k: string; // dimension label
  v: number; // 0–100
}

export interface ScatterPoint {
  x: number; // hold time (minutes)
  y: number; // R outcome
  z: number; // bubble size (position size proxy)
}

export interface CalendarDay {
  d: number; // day of month
  r: number; // return %
}

/* ── summary stats ── */

export interface AnalyticsStats {
  totalTrades: number;
  winRate: number;
  expectancy: number;
  profitFactor: number;
  sharpe: number | null; // null until a risk-free/returns series is wired
  sortino: number | null;
  maxDd: number;
  avgWin: number;
  avgLoss: number;
  payoff: number;
  bestStreak: number;
  worstStreak: number;
  avgHold: string;
  netPnl: number;
  netPnlPct: number;
  benchPct: number;
}

export interface AnalyticsResponse {
  range: Range;
  stats: AnalyticsStats;
  equityVsBench: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  rDistribution: RBucket[];
  // "pct" when trades have no rMultiple (e.g. trend-rs55, which has no fixed
  // stop-loss) — rDistribution/heldVsR are then bucketed/plotted by realized
  // return % instead of R-multiple.
  rDistributionMode: "r" | "pct";
  setupEdge: SetupEdge[];
  sectorPerf: SectorPerf[];
  hourly: HourlyPnl[];
  radar: RadarPoint[];
  heldVsR: ScatterPoint[];
  calendar: CalendarDay[];
}
