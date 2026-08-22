/* ─────────────────────────────────────────────────────
   TRADE JOURNAL — capture schema (RSI-2 swing strategy)
   ─────────────────────────────────────────────────────
   Two structural rules baked in:
   1. entry {} and exit {} are separate objects. The entry object is
      LOCKED once an exit is written — enforces the no-hindsight rule.
   2. dataQuality marks messy/contaminated trades excludable, so the
      headline win-rate can run on clean trades without deleting the rest.

   Principle: store the VALUES, not the booleans. "RSI was 4.44" lets you
   later ask "do sub-2 trades beat 4–5 trades?". A boolean throws that away.
───────────────────────────────────────────────────── */

export type Direction = "LONG" | "SHORT";
export type Outcome = "TARGET" | "STOP" | "TREND-FLIP" | "MANUAL-EXIT" | "STILL-OPEN";

/** Where the entry candle closed within its own range. */
export type ClosePosition =
  | "at-low"
  | "lower-third"
  | "mid"
  | "upper-third"
  | "at-high";

/** Character of the down-move volume into the entry. */
export type VolumeCharacter =
  | "climactic"
  | "above-average"
  | "average"
  | "quiet";

/** Index trend: Nifty vs its own 200 EMA on the entry date. */
export type MarketTrend = "up" | "down";

export type DataQuality = "clean" | "excludable";

/** Did the trade follow the system, or was it a discretionary call? */
export type RuleAdherence = "system" | "discretionary";

// ── Trade-path analytics (MAE/MFE + exit optimizer) ───────────────────────────

export interface ExitSim {
  key: string;
  label: string;
  exitPrice: number;
  exitDate: string;
  daysHeld: number;
  reason: string;
  rMultiple: number | null;
  pnl: number;
}

export interface TradeAnalytics {
  mae: number;
  maePct: number;
  maeR: number | null;
  mfe: number;
  mfePct: number;
  mfeR: number | null;
  daysToMfe: number;
  mfeCaptureRatio: number | null;
  risk: number;
  actualR: number | null;
  sims: ExitSim[];
  best: { key: string; label: string; rMultiple: number | null };
  windowFrom: string;
  windowTo: string;
  computedAt: string;
}

// ── Entry object — locked once exit is written ────────────────────────────────

export interface TradeEntry {
  // Tier 1 · identity & execution
  ticker: string;
  entryDate: string; // ISO datetime
  direction: Direction;
  entryPrice: number;
  quantity: number;
  // Absent for strategies with no fixed exit levels (trend-flip-only exits).
  targetPrice?: number;
  stopPrice?: number;
  rs55Pct?: number;
  atr14: number; // ATR(14) at entry

  // Tier 1 · four rule-checks — stored as VALUES
  priceAbove200: boolean; // genuinely pass/fail (derived from entryPrice)
  distanceFrom200Ema: number; // % close vs 200 EMA
  rsi2: number; // RSI(2) actual value
  candlesFromHigh: number; // N of 20 — candle count from recent high

  // Tier 2 · diagnostic
  pullbackDepth: number; // % from recent high (likely most predictive)
  entryCandleClose: ClosePosition;
  distanceTo50Ema: number; // % entry to 50 EMA
  downMoveVolume: VolumeCharacter;
  targetUnderResistance: boolean; // structural target block
  stopHasSupport: boolean; // structural stop support (vs open air)

  // Tier 3 · context
  niftyVs200Ema: MarketTrend;
  niftyRsi2: number;
  sector: string;
  marketCapCategory?: string | null;
  gappedIntoEntry: boolean;
  candlesAvailable: number; // days since listing / candles available
  eventWithinWindow: boolean; // earnings/event inside holding window

  // Chart + Claude's read, captured at entry
  screenshot?: string | null; // image URL / data URI of the chart shared
  aiAnalysis?: string; // Claude's analysis of the setup at entry

  notes?: string;
}

// ── Exit object — written in Phase 2 ──────────────────────────────────────────

export interface ChargesBreakdown {
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  sebiCharges: number;
  stampDuty: number;
  dpCharges: number;
  gst: number;
  totalCharges: number;
}

export interface TradeExit {
  outcome: Exclude<Outcome, "STILL-OPEN">;
  exitPrice: number;
  exitDate: string; // ISO datetime
  // Quantity actually exited — absent/equal to the full position on a full exit.
  quantity?: number;
  manualExitReason?: string; // required when outcome === "MANUAL-EXIT"
  // Intraday excursion flags — did price touch the opposite level first?
  stopWickedThenRecovered?: boolean;
  targetTaggedThenReversed?: boolean;
  maxAdverseExcursion?: number | null; // worst % against before it worked

  // Chart + Claude's read, captured at exit (SL / target)
  screenshot?: string | null;
  aiAnalysis?: string;
  charges?: ChargesBreakdown | null;
  netPnlAmount?: number | null;
}

// ── Full record ───────────────────────────────────────────────────────────────

export interface JournalTrade {
  id: string;
  tradeNumber: number;
  entry: TradeEntry;
  exit: TradeExit | null; // null while STILL-OPEN
  outcome: Outcome;
  dataQuality: DataQuality;
  dataQualityNote?: string;
  source: "manual" | "auto";
  strategyId?: string | null;
  needsReview: boolean;
  gttPlaced: boolean;
  ruleAdherence?: RuleAdherence | null;
  ruleAdherenceNote?: string | null;
  analytics?: TradeAnalytics | null;
  /** AI review of a CLOSED trade against the strategy's own rules —
   * generated on demand, persisted until regenerated. */
  tradeInsight?: {
    text: string;
    entryCheck: {
      date: string;
      signalFound: boolean;
      inToBuy?: boolean;
      inCandidates?: boolean;
      wasStale?: boolean;
    };
    exitCheck: {
      date: string;
      signalFound: boolean;
      inExits?: boolean;
      wasStale?: boolean;
    };
    generatedAt: string;
  } | null;
  /** Free-form review note — unlike entry.notes (locked once the trade
   * closes), this is editable any time by the trader or by AI. Works on
   * open or closed trades. */
  reviewNote?: string | null;
  reviewNoteSource?: "user" | "ai" | null;
  reviewNoteUpdatedAt?: string | null;
  /** Last price mark seen for this open position (from phalanx-live's daily
   * OHLCV) — set once at entry, nothing currently refreshes it afterward. */
  markPrice?: number | null;
  markUpdatedAt?: string | null;
  /** The OHLCV bar's own trading-day date behind markPrice — this is the
   * real "data as of" date; markUpdatedAt is just when the mark was set. */
  markDate?: string | null;
  /** Previous trading day's close for the same symbol — lets the UI show a
   * daily % move alongside the since-entry move. */
  markPrevClose?: number | null;
  /** Current Mansfield RS vs Nifty (EMA 55) — a live reading, refreshed
   * alongside markPrice. Distinct from entry.rs55Pct, the frozen rank-based
   * value from the entry signal. */
  markRs?: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload to confirm an auto-captured trade (add screenshot + comment). */
export interface ReviewPayload {
  screenshot?: string;
  aiAnalysis?: string;
  targetUnderResistance?: boolean;
  stopHasSupport?: boolean;
  sector?: string;
  eventWithinWindow?: boolean;
  dataQuality?: DataQuality;
  notes?: string;
}

/** Payload sent when logging a new trade (entry-time capture). */
export interface NewTradePayload {
  entry: TradeEntry;
  dataQuality: DataQuality;
  dataQualityNote?: string;
}

/** Payload sent when recording the exit (Phase 2). */
export interface ExitTradePayload {
  outcome: Exclude<Outcome, "STILL-OPEN">;
  exitPrice: number;
  exitDate: string;
  // Omit to exit the full held quantity; a partial exit leaves the rest open.
  quantity?: number;
  manualExitReason?: string;
  stopWickedThenRecovered?: boolean;
  targetTaggedThenReversed?: boolean;
  maxAdverseExcursion?: number;
  screenshot?: string;
  aiAnalysis?: string;
}
