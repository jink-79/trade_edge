import type {
  AnalyticsResponse,
  EquityPoint,
  MonthlyReturn,
  RBucket,
  SetupEdge,
  SectorPerf,
  HourlyPnl,
  RadarPoint,
  ScatterPoint,
  CalendarDay,
  AnalyticsStats,
} from "../types/analytics.types";

export const MOCK_EQUITY_VS_BENCH: EquityPoint[] = [
  { d: "Jan", you: 25000, bench: 25000, dd: 0 },
  { d: "Feb", you: 26840, bench: 25420, dd: -1.8 },
  { d: "Mar", you: 28110, bench: 25980, dd: -0.9 },
  { d: "Apr", you: 27240, bench: 26310, dd: -4.2 },
  { d: "May", you: 29380, bench: 26890, dd: -1.1 },
  { d: "Jun", you: 31420, bench: 27240, dd: 0 },
  { d: "Jul", you: 30680, bench: 27680, dd: -3.4 },
  { d: "Aug", you: 33120, bench: 28010, dd: -0.8 },
  { d: "Sep", you: 34780, bench: 28520, dd: -1.6 },
  { d: "Oct", you: 36410, bench: 29110, dd: 0 },
  { d: "Nov", you: 38260, bench: 29680, dd: -2.1 },
  { d: "Dec", you: 41230, bench: 30240, dd: 0 },
];

export const MOCK_MONTHLY_RETURNS: MonthlyReturn[] = [
  { m: "Jan", r: 3.4 },
  { m: "Feb", r: 4.7 },
  { m: "Mar", r: -3.1 },
  { m: "Apr", r: 7.8 },
  { m: "May", r: 6.9 },
  { m: "Jun", r: -2.4 },
  { m: "Jul", r: 8.0 },
  { m: "Aug", r: 5.0 },
  { m: "Sep", r: 4.7 },
  { m: "Oct", r: 5.1 },
  { m: "Nov", r: -1.8 },
  { m: "Dec", r: 7.7 },
];

export const MOCK_R_DISTRIBUTION: RBucket[] = [
  { bucket: "-3R", n: 4 },
  { bucket: "-2R", n: 9 },
  { bucket: "-1R", n: 38 },
  { bucket: "0R", n: 22 },
  { bucket: "+1R", n: 64 },
  { bucket: "+2R", n: 41 },
  { bucket: "+3R", n: 23 },
  { bucket: "+4R", n: 11 },
  { bucket: "+5R", n: 4 },
];

export const MOCK_SETUP_EDGE: SetupEdge[] = [
  { setup: "Breakout", trades: 84, win: 64, exp: 1.42 },
  { setup: "Pullback", trades: 71, win: 58, exp: 1.18 },
  { setup: "Reversal", trades: 46, win: 41, exp: -0.22 },
  { setup: "Gap-n-Go", trades: 38, win: 55, exp: 0.74 },
  { setup: "VWAP Bounce", trades: 52, win: 60, exp: 0.96 },
  { setup: "Earnings", trades: 19, win: 48, exp: -0.41 },
];

export const MOCK_SECTOR_PERF: SectorPerf[] = [
  { sector: "Tech", pnl: 5240, trades: 42 },
  { sector: "Energy", pnl: 2180, trades: 18 },
  { sector: "Financials", pnl: -640, trades: 21 },
  { sector: "Health", pnl: 1820, trades: 17 },
  { sector: "Consumer", pnl: 980, trades: 14 },
  { sector: "Industrials", pnl: -310, trades: 9 },
  { sector: "Crypto", pnl: 3120, trades: 11 },
];

export const MOCK_HOURLY: HourlyPnl[] = [
  { h: "9:30", pnl: 480 },
  { h: "10", pnl: 1240 },
  { h: "11", pnl: 780 },
  { h: "12", pnl: -210 },
  { h: "13", pnl: -340 },
  { h: "14", pnl: 920 },
  { h: "15", pnl: 1380 },
  { h: "16", pnl: 410 },
];

export const MOCK_RADAR: RadarPoint[] = [
  { k: "Discipline", v: 86 },
  { k: "Patience", v: 72 },
  { k: "Risk Mgmt", v: 91 },
  { k: "Entries", v: 78 },
  { k: "Exits", v: 64 },
  { k: "Sizing", v: 81 },
];

export const MOCK_HELD_VS_R: ScatterPoint[] = [
  { x: 5, y: 0.6, z: 20 },
  { x: 12, y: 1.4, z: 35 },
  { x: 22, y: -0.8, z: 18 },
  { x: 35, y: 2.1, z: 50 },
  { x: 48, y: 1.7, z: 40 },
  { x: 60, y: -1.2, z: 22 },
  { x: 75, y: 2.8, z: 60 },
  { x: 92, y: 0.4, z: 24 },
  { x: 110, y: 3.2, z: 70 },
  { x: 130, y: -1.6, z: 28 },
  { x: 160, y: 1.1, z: 32 },
  { x: 190, y: 2.4, z: 55 },
];

const CALENDAR_SEEDS = [
  0, 1.2, -0.4, 0, 2.1, 0.6, -1.1, 0, 0, 1.8, 0.3, -0.6, 1.4, 0, 2.6, -0.2, 0.9,
  1.1, -1.6, 0, 0.7, 2.0, 0, 0.4, -0.9, 1.3, 0, 0.5, 1.9, -0.3, 0.8, 0, 1.5,
  0.2, -1.2,
];
export const MOCK_CALENDAR: CalendarDay[] = CALENDAR_SEEDS.map((r, i) => ({
  d: i + 1,
  r,
}));

export const MOCK_STATS: AnalyticsStats = {
  totalTrades: 310,
  winRate: 62.1,
  expectancy: 0.84,
  profitFactor: 2.14,
  sharpe: 1.92,
  sortino: 2.46,
  maxDd: -7.4,
  avgWin: 412,
  avgLoss: -188,
  payoff: 412 / 188,
  bestStreak: 11,
  worstStreak: 4,
  avgHold: "1d 6h",
  netPnl: 16230,
  netPnlPct: 38.4,
  benchPct: 20.9,
};

export const MOCK_ANALYTICS_RESPONSE: AnalyticsResponse = {
  range: "YTD",
  stats: MOCK_STATS,
  equityVsBench: MOCK_EQUITY_VS_BENCH,
  monthlyReturns: MOCK_MONTHLY_RETURNS,
  rDistribution: MOCK_R_DISTRIBUTION,
  rDistributionMode: "r",
  setupEdge: MOCK_SETUP_EDGE,
  sectorPerf: MOCK_SECTOR_PERF,
  hourly: MOCK_HOURLY,
  radar: MOCK_RADAR,
  heldVsR: MOCK_HELD_VS_R,
  calendar: MOCK_CALENDAR,
};
