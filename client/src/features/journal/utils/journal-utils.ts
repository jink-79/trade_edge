import type {
  ClosePosition,
  Direction,
  JournalTrade,
  MarketTrend,
  TradeEntry,
  VolumeCharacter,
} from "../types/journal.types";

/**
 * Trades with no `strategyId` predate strategy tagging — all of today's
 * historical data is rsi2, so that's the safe default for "which fields
 * should this trade have."
 */
export const isTrendRs55 = (t: Pick<JournalTrade, "strategyId">) =>
  (t.strategyId ?? "rsi2") === "trend-rs55";

export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/** Price/money with up to 2 decimals — shows paise only when present. */
export const fmtPrice = (n: number | null | undefined) =>
  n == null
    ? "—"
    : "₹" +
      n.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      });

/** Signed money, e.g. "+₹1,234" / "−₹1,234". */
export const fmtSignedINR = (n: number) =>
  `${n >= 0 ? "+" : "−"}${fmtPrice(Math.abs(n))}`;

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
  // null when the strategy has no fixed stop/target (trend-flip-only exits)
  initialRiskPerShare: number | null; // entry − stop (long)
  capitalAtRisk: number | null; // qty × risk/share
  rewardPerShare: number | null;
  plannedRR: number | null; // reward ÷ risk
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
    stopPrice?: number;
    targetPrice?: number;
    quantity: number;
    atr14: number;
  },
  accountCapital: number,
): EntryMetrics {
  const long = e.direction === "LONG";
  const hasLevels = e.stopPrice != null && e.targetPrice != null;
  const initialRiskPerShare = hasLevels
    ? long
      ? e.entryPrice - e.stopPrice!
      : e.stopPrice! - e.entryPrice
    : null;
  const rewardPerShare = hasLevels
    ? long
      ? e.targetPrice! - e.entryPrice
      : e.entryPrice - e.targetPrice!
    : null;

  const capitalDeployed = e.entryPrice * e.quantity;
  const capitalAtRisk =
    initialRiskPerShare != null ? Math.max(initialRiskPerShare, 0) * e.quantity : null;

  return {
    capitalDeployed,
    initialRiskPerShare,
    capitalAtRisk,
    rewardPerShare,
    plannedRR:
      initialRiskPerShare != null && rewardPerShare != null && initialRiskPerShare > 0
        ? rewardPerShare / initialRiskPerShare
        : null,
    atrPctOfEntry: e.entryPrice > 0 ? (e.atr14 / e.entryPrice) * 100 : 0,
    positionSizePct:
      accountCapital > 0 ? (capitalDeployed / accountCapital) * 100 : 0,
    priceAbove200: e.entryPrice > PRICE_FLOOR,
  };
}

/**
 * Client-side mirror of the backend's journal.charges.ts — same Zerodha-style
 * equity-delivery rate card, so the exit dialog can show a live preview
 * before submit. The backend recomputes and stores the authoritative figure.
 */
export interface ChargesEstimate {
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  sebiCharges: number;
  stampDuty: number;
  dpCharges: number;
  gst: number;
  totalCharges: number;
}

const CHARGE_RATES = {
  sttPct: 0.001,
  exchangeTxnPct: 0.0000297,
  sebiPct: 0.000001,
  stampDutyPct: 0.00015,
  dpChargesFlat: 15.93,
  gstPct: 0.18,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function estimateCharges(buyValue: number, sellValue: number): ChargesEstimate {
  const brokerage = 0;
  const stt = round2((buyValue + sellValue) * CHARGE_RATES.sttPct);
  const exchangeCharges = round2((buyValue + sellValue) * CHARGE_RATES.exchangeTxnPct);
  const sebiCharges = round2((buyValue + sellValue) * CHARGE_RATES.sebiPct);
  const stampDuty = round2(buyValue * CHARGE_RATES.stampDutyPct);
  const dpCharges = CHARGE_RATES.dpChargesFlat;
  const gst = round2((brokerage + exchangeCharges + sebiCharges) * CHARGE_RATES.gstPct);
  const totalCharges = round2(
    brokerage + stt + exchangeCharges + sebiCharges + stampDuty + dpCharges + gst,
  );
  return { brokerage, stt, exchangeCharges, sebiCharges, stampDuty, dpCharges, gst, totalCharges };
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
  const initialRiskPerShare =
    entry.stopPrice == null
      ? null
      : long
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
      initialRiskPerShare != null && initialRiskPerShare > 0
        ? pnlPerShare / initialRiskPerShare
        : null,
    daysHeld,
    win: realizedPnl > 0,
  };
}
