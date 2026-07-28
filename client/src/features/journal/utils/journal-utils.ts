import type {
  ClosePosition,
  Direction,
  MarketTrend,
  TradeEntry,
  VolumeCharacter,
} from "../types/journal.types";

export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/** Price filter threshold for the strategy (₹200). */
export const PRICE_FLOOR = 200;

// ── Enum option lists (label + description for the UI) ─────────────────────────

export const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "LONG", label: "Long" },
  { value: "SHORT", label: "Short" },
];

export const CLOSE_POSITIONS: { value: ClosePosition; label: string }[] = [
  { value: "at-low", label: "At low" },
  { value: "lower-third", label: "Lower ⅓" },
  { value: "mid", label: "Mid" },
  { value: "upper-third", label: "Upper ⅓" },
  { value: "at-high", label: "At high" },
];

export const VOLUME_CHARACTERS: { value: VolumeCharacter; label: string }[] = [
  { value: "climactic", label: "Climactic" },
  { value: "above-average", label: "Above avg" },
  { value: "average", label: "Average" },
  { value: "quiet", label: "Quiet" },
];

export const MARKET_TRENDS: { value: MarketTrend; label: string }[] = [
  { value: "up", label: "Up (above 200 EMA)" },
  { value: "down", label: "Down (below 200 EMA)" },
];

// ── Tier 4 — derived metrics (compute, never store) ───────────────────────────

export interface EntryMetrics {
  capitalDeployed: number; // entry × qty
  initialRiskPerShare: number; // entry − stop (long)
  capitalAtRisk: number; // qty × risk/share
  rewardPerShare: number;
  plannedRR: number; // reward ÷ risk
  atrPctOfEntry: number; // ATR as % of entry — volatility regime
  positionSizePct: number; // capital deployed ÷ account capital
  priceAbove200: boolean; // entry > ₹200
}

/**
 * Everything the app should calculate rather than let the user type — so the
 * numbers are always internally consistent.
 */
export function deriveEntryMetrics(
  e: {
    direction: Direction;
    entryPrice: number;
    stopPrice: number;
    targetPrice: number;
    quantity: number;
    atr14: number;
  },
  accountCapital: number,
): EntryMetrics {
  const long = e.direction === "LONG";
  const initialRiskPerShare = long
    ? e.entryPrice - e.stopPrice
    : e.stopPrice - e.entryPrice;
  const rewardPerShare = long
    ? e.targetPrice - e.entryPrice
    : e.entryPrice - e.targetPrice;

  const capitalDeployed = e.entryPrice * e.quantity;
  const capitalAtRisk = Math.max(initialRiskPerShare, 0) * e.quantity;

  return {
    capitalDeployed,
    initialRiskPerShare,
    capitalAtRisk,
    rewardPerShare,
    plannedRR: initialRiskPerShare > 0 ? rewardPerShare / initialRiskPerShare : 0,
    atrPctOfEntry: e.entryPrice > 0 ? (e.atr14 / e.entryPrice) * 100 : 0,
    positionSizePct:
      accountCapital > 0 ? (capitalDeployed / accountCapital) * 100 : 0,
    priceAbove200: e.entryPrice > PRICE_FLOOR,
  };
}

/** Realised metrics — computed once an exit exists. */
export function deriveExitMetrics(
  entry: Pick<
    TradeEntry,
    "direction" | "entryPrice" | "stopPrice" | "quantity" | "entryDate"
  >,
  exit: { exitPrice: number; exitDate: string },
) {
  const long = entry.direction === "LONG";
  const pnlPerShare = long
    ? exit.exitPrice - entry.entryPrice
    : entry.entryPrice - exit.exitPrice;
  const initialRiskPerShare = long
    ? entry.entryPrice - entry.stopPrice
    : entry.stopPrice - entry.entryPrice;

  const realizedPnl = pnlPerShare * entry.quantity;
  const invested = entry.entryPrice * entry.quantity;
  const daysHeld = Math.max(
    0,
    Math.floor(
      (new Date(exit.exitDate).getTime() -
        new Date(entry.entryDate).getTime()) /
        86400000,
    ),
  );

  return {
    realizedPnl,
    realizedPnlPct: invested > 0 ? (realizedPnl / invested) * 100 : 0,
    rMultiple:
      initialRiskPerShare > 0 ? pnlPerShare / initialRiskPerShare : null,
    daysHeld,
    win: realizedPnl > 0,
  };
}
