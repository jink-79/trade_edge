/**
 * Indicator-compute service — turns OHLCV candles into the derivable journal
 * fields. Pure + deterministic so the numbers are always consistent.
 * All indicators are evaluated AT the entry candle (not the latest bar).
 */

import type {
  ClosePosition,
  MarketTrend,
  VolumeCharacter,
} from "./journal.types";

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── indicators ────────────────────────────────────────────────────────────────

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period; // seed SMA
  for (let i = period; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

/** Wilder's RSI, evaluated on the final value of `closes`. */
function rsi(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

/** Wilder's ATR over `candles`, final value. */
function atr(candles: Candle[], period: number): number | null {
  if (candles.length < period + 1) return null;
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    const pc = candles[i - 1].close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  let a = tr.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < tr.length; i++) a = (a * (period - 1) + tr[i]) / period;
  return a;
}

// ── classifiers ─────────────────────────────────────────────────────────────

function closePosition(c: Candle): ClosePosition {
  const range = c.high - c.low;
  if (range <= 0) return "mid";
  const pos = (c.close - c.low) / range;
  if (pos <= 0.1) return "at-low";
  if (pos <= 0.4) return "lower-third";
  if (pos < 0.6) return "mid";
  if (pos < 0.9) return "upper-third";
  return "at-high";
}

function volumeCharacter(ratio: number): VolumeCharacter {
  if (ratio >= 2) return "climactic";
  if (ratio >= 1.3) return "above-average";
  if (ratio >= 0.7) return "average";
  return "quiet";
}

// ── main ──────────────────────────────────────────────────────────────────────

export interface ComputedEntry {
  atr14: number;
  priceAbove200: boolean;
  distanceFrom200Ema: number;
  rsi2: number;
  candlesFromHigh: number;
  pullbackDepth: number;
  entryCandleClose: ClosePosition;
  distanceTo50Ema: number;
  downMoveVolume: VolumeCharacter;
  gappedIntoEntry: boolean;
}

/** Index of the entry candle: exact date match, else the last bar on/before it. */
function entryIndex(candles: Candle[], entryDate: string): number {
  const day = entryDate.slice(0, 10);
  const exact = candles.findIndex((c) => c.date.slice(0, 10) === day);
  if (exact !== -1) return exact;
  const t = new Date(entryDate).getTime();
  let idx = -1;
  for (let i = 0; i < candles.length; i++) {
    if (new Date(candles[i].date).getTime() <= t) idx = i;
    else break;
  }
  return idx === -1 ? candles.length - 1 : idx;
}

export function computeEntryIndicators(
  candles: Candle[],
  entryPrice: number,
  entryDate: string,
  atrPeriod = 14,
): ComputedEntry {
  const idx = entryIndex(candles, entryDate);
  const upto = candles.slice(0, idx + 1);
  const entry = candles[idx];
  const closes = upto.map((c) => c.close);

  const ema200 = ema(closes, 200);
  const ema50 = ema(closes, 50);
  const atr14 = atr(upto, atrPeriod) ?? 0;

  // recent-20 window ending at the entry candle
  const win = candles.slice(Math.max(0, idx - 19), idx + 1);
  let highVal = -Infinity;
  let highLocal = 0;
  win.forEach((c, i) => {
    if (c.high > highVal) {
      highVal = c.high;
      highLocal = i;
    }
  });
  const candlesFromHigh = win.length - 1 - highLocal;
  const pullbackDepth =
    highVal > 0 ? round2(((highVal - entry.close) / highVal) * 100) : 0;

  // volume vs prior-20 average
  const prior = candles.slice(Math.max(0, idx - 20), idx);
  const avgVol =
    prior.length > 0
      ? prior.reduce((s, c) => s + c.volume, 0) / prior.length
      : entry.volume;
  const volRatio = avgVol > 0 ? entry.volume / avgVol : 1;

  const prevClose = idx > 0 ? candles[idx - 1].close : entry.open;
  const gapPct = prevClose > 0 ? ((entry.open - prevClose) / prevClose) * 100 : 0;

  return {
    atr14: round2(atr14),
    priceAbove200: entryPrice > 200,
    distanceFrom200Ema:
      ema200 != null ? round2(((entry.close - ema200) / ema200) * 100) : 0,
    rsi2: round2(rsi(closes, 2) ?? 0),
    candlesFromHigh,
    pullbackDepth,
    entryCandleClose: closePosition(entry),
    distanceTo50Ema:
      ema50 != null ? round2(((entry.close - ema50) / ema50) * 100) : 0,
    downMoveVolume: volumeCharacter(volRatio),
    gappedIntoEntry: Math.abs(gapPct) >= 0.5,
  };
}

/**
 * RS-55 exactly as phalanx-live computes it (core/daily_rules.py):
 * (stock 55-trading-day return) / (Nifty 55-trading-day return) - 1, as a %.
 * Null when either series doesn't have 55 bars of history before the entry
 * candle — matches phalanx-live's own NaN-and-skip behavior.
 */
export function computeRs55(
  candles: Candle[],
  indexCandles: Candle[],
  entryDate: string,
): number | null {
  if (candles.length === 0 || indexCandles.length === 0) return null;
  const idx = entryIndex(candles, entryDate);
  const niftyIdx = entryIndex(indexCandles, entryDate);
  if (idx < 55 || niftyIdx < 55) return null;

  const stockPrev = candles[idx - 55].close;
  const niftyPrev = indexCandles[niftyIdx - 55].close;
  if (stockPrev === 0 || niftyPrev === 0) return null;

  const stockFactor = candles[idx].close / stockPrev;
  const niftyFactor = indexCandles[niftyIdx].close / niftyPrev;
  if (niftyFactor === 0) return null;

  return round2((stockFactor / niftyFactor - 1) * 100);
}

/** EMA at every index of `values` (not just the final one) — the private
 * `ema()` helper above only returns the last value, which is all
 * computeEntryIndicators ever needed; a chart-plotted series needs the whole
 * path. Null before the seed period fills. */
function emaSeriesOf(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = e;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

/**
 * Mansfield Relative Strength vs Nifty, at every bar in `stockCandles` — the
 * same indicator shown on TradingView (e.g. "Mansfield RS NIFTY EMA 55"),
 * NOT phalanx-live's own rs55 rank formula (which is a single snapshot value
 * at entry, used for the actual entry/exit signal — see computeRs55).
 * This is: ((price-relative / EMA(price-relative, period)) - 1) * 100, where
 * price-relative = stock close / Nifty close. Aligned to `stockCandles` by
 * index; null until the EMA warms up.
 */
export function computeMansfieldRsSeries(
  stockCandles: Candle[],
  niftyCandles: Candle[],
  period = 55,
): (number | null)[] {
  const niftyByDate = new Map(niftyCandles.map((c) => [c.date.slice(0, 10), c.close]));

  // Price-relative needs a gap-free numeric series for the EMA walk; NSE
  // stock and Nifty trade the same calendar almost always, so a missing
  // Nifty bar (rare) just forward-fills from the last known ratio rather
  // than breaking the EMA computation.
  let lastRatio = 0;
  const priceRelative = stockCandles.map((c) => {
    const n = niftyByDate.get(c.date.slice(0, 10));
    if (n != null && n !== 0) lastRatio = c.close / n;
    return lastRatio;
  });

  const emaOfRatio = emaSeriesOf(priceRelative, period);

  return priceRelative.map((pr, i) => {
    const e = emaOfRatio[i];
    if (e == null || e === 0) return null;
    return round2((pr / e - 1) * 100);
  });
}

export interface Regime {
  niftyVs200Ema: MarketTrend;
  niftyRsi2: number;
}

export function computeRegime(indexCandles: Candle[]): Regime {
  if (indexCandles.length === 0) return { niftyVs200Ema: "up", niftyRsi2: 0 };
  const closes = indexCandles.map((c) => c.close);
  const ema200 = ema(closes, 200);
  const last = closes[closes.length - 1];
  return {
    niftyVs200Ema: ema200 != null && last > ema200 ? "up" : "down",
    niftyRsi2: round2(rsi(closes, 2) ?? 0),
  };
}

// ── stock strength scorecard — technical, not AI ───────────────────────────────
//
// Six components, purely rule-based off the same OHLCV this module already
// reads. Trend-following weighting (this strategy has no mean-reversion
// concept), evaluated at the LAST bar in `stockCandles` — i.e. "how strong
// is this stock right now", not frozen at entry or exit.

export type StrengthLabel = "Strong" | "Neutral" | "Weak";

export interface StrengthComponent {
  score: number; // 0-100
  detail: string;
}

export interface StockStrength {
  score: number; // weighted 0-100
  label: StrengthLabel;
  asOfDate: string;
  niftyRegime: MarketTrend; // context, not part of the score
  components: {
    trendAlignment: StrengthComponent;
    emaDistance: StrengthComponent;
    relativeStrength: StrengthComponent;
    volatility: StrengthComponent;
    momentum: StrengthComponent;
    volume: StrengthComponent;
  };
}

const STRENGTH_WEIGHTS = {
  trendAlignment: 25,
  emaDistance: 15,
  relativeStrength: 25,
  volatility: 10,
  momentum: 15,
  volume: 10,
} as const;

export function computeStockStrength(
  stockCandles: Candle[],
  niftyCandles: Candle[],
): StockStrength | null {
  // 200 EMA needs real warmup; below this the read would be noise.
  if (stockCandles.length < 210 || niftyCandles.length < 60) return null;

  const closes = stockCandles.map((c) => c.close);
  const last = stockCandles[stockCandles.length - 1];
  const ema200 = ema(closes, 200);
  const ema50 = ema(closes, 50);

  // 1. Trend alignment — price above 200 EMA, above 50 EMA, and the EMAs
  // themselves stacked bullishly (50 above 200).
  const aligns: string[] = [];
  let alignScore = 0;
  if (ema200 != null && last.close > ema200) {
    alignScore += 34;
    aligns.push("above 200 EMA");
  }
  if (ema50 != null && last.close > ema50) {
    alignScore += 33;
    aligns.push("above 50 EMA");
  }
  if (ema50 != null && ema200 != null && ema50 > ema200) {
    alignScore += 33;
    aligns.push("50 EMA above 200 EMA");
  }
  const trendAlignment: StrengthComponent = {
    score: Math.round(alignScore),
    detail: aligns.length ? aligns.join(", ") : "below both EMAs — bearish stack",
  };

  // 2. Distance from 200 EMA — a healthy trend runs 5-25% above it; too
  // close means the trend just started (fragile), too far means extended.
  let emaDistScore = 0;
  let distPct = 0;
  if (ema200 != null) {
    distPct = ((last.close - ema200) / ema200) * 100;
    if (distPct < 0) emaDistScore = 0;
    else if (distPct < 5) emaDistScore = 55;
    else if (distPct <= 25) emaDistScore = 100;
    else if (distPct <= 40) emaDistScore = 60;
    else emaDistScore = 30;
  }
  const emaDistance: StrengthComponent = {
    score: emaDistScore,
    detail:
      ema200 != null
        ? `${distPct >= 0 ? "+" : ""}${distPct.toFixed(1)}% from 200 EMA`
        : "insufficient history",
  };

  // 3. Relative strength — Mansfield RS level AND direction (a stock can
  // still be RS-positive while actively weakening, or RS-negative while
  // improving).
  const rsSeries = computeMansfieldRsSeries(stockCandles, niftyCandles, 55);
  const rsNow = rsSeries[rsSeries.length - 1];
  const rsPrior = rsSeries[Math.max(0, rsSeries.length - 11)];
  let rsScore = 50;
  let rsDetail = "insufficient data";
  if (rsNow != null) {
    const rising = rsPrior == null || rsNow > rsPrior;
    if (rsNow > 0 && rising) {
      rsScore = 100;
      rsDetail = `RS +${rsNow.toFixed(1)}% and rising`;
    } else if (rsNow > 0 && !rising) {
      rsScore = 60;
      rsDetail = `RS +${rsNow.toFixed(1)}% but flattening or falling`;
    } else if (rsNow <= 0 && rising) {
      rsScore = 40;
      rsDetail = `RS ${rsNow.toFixed(1)}% but improving`;
    } else {
      rsScore = 0;
      rsDetail = `RS ${rsNow.toFixed(1)}% and falling`;
    }
  }
  const relativeStrength: StrengthComponent = { score: rsScore, detail: rsDetail };

  // 4. Volatility regime — ATR% of price now vs ~20 sessions ago. Sharply
  // expanding volatility often precedes a trend change, not confirms one.
  const atr14Now = atr(stockCandles, 14);
  const priorSlice = stockCandles.slice(0, Math.max(0, stockCandles.length - 20));
  const atr14Prior = priorSlice.length > 15 ? atr(priorSlice, 14) : null;
  let volScore = 50;
  let volDetail = "insufficient data";
  if (atr14Now != null && last.close > 0) {
    const atrPctNow = (atr14Now / last.close) * 100;
    if (atr14Prior != null && priorSlice.length > 0) {
      const priorClose = priorSlice[priorSlice.length - 1].close;
      const atrPctPrior = priorClose > 0 ? (atr14Prior / priorClose) * 100 : 0;
      const change = atrPctPrior > 0 ? (atrPctNow - atrPctPrior) / atrPctPrior : 0;
      if (change <= 0.2) {
        volScore = 100;
        volDetail = `ATR ${atrPctNow.toFixed(1)}% of price, stable`;
      } else if (change <= 0.5) {
        volScore = 60;
        volDetail = `ATR ${atrPctNow.toFixed(1)}% of price, expanding`;
      } else {
        volScore = 20;
        volDetail = `ATR ${atrPctNow.toFixed(1)}% of price, sharply expanding`;
      }
    } else {
      volScore = 60;
      volDetail = `ATR ${atrPctNow.toFixed(1)}% of price`;
    }
  }
  const volatility: StrengthComponent = { score: volScore, detail: volDetail };

  // 5. Momentum consistency — up-day ratio over the last 20 sessions, blended
  // with proximity to the 20-session high (near-highs is healthy; far off
  // highs is weakening; sitting exactly at the high can be a blow-off, so
  // it's capped rather than maximized).
  const window = stockCandles.slice(-20);
  let upDays = 0;
  for (let i = 1; i < window.length; i++) {
    if (window[i].close > window[i - 1].close) upDays++;
  }
  const upRatio = window.length > 1 ? upDays / (window.length - 1) : 0.5;
  const rollingHigh = Math.max(...window.map((c) => c.high));
  const pctOffHigh = rollingHigh > 0 ? ((rollingHigh - last.close) / rollingHigh) * 100 : 0;
  let proximityScore: number;
  if (pctOffHigh <= 3) proximityScore = 90;
  else if (pctOffHigh <= 10) proximityScore = 100;
  else if (pctOffHigh <= 20) proximityScore = 60;
  else proximityScore = 25;
  const momentum: StrengthComponent = {
    score: Math.round(upRatio * 100 * 0.5 + proximityScore * 0.5),
    detail: `${Math.round(upRatio * 100)}% up-days, ${pctOffHigh.toFixed(1)}% off 20-session high`,
  };

  // 6. Volume confirmation — average volume on up-closes vs down-closes over
  // the same 20-session window. Rising price on rising volume is
  // accumulation; rising price on fading volume is a weaker signal.
  let upVolSum = 0;
  let upVolCount = 0;
  let downVolSum = 0;
  let downVolCount = 0;
  for (let i = 1; i < window.length; i++) {
    if (window[i].close > window[i - 1].close) {
      upVolSum += window[i].volume;
      upVolCount++;
    } else if (window[i].close < window[i - 1].close) {
      downVolSum += window[i].volume;
      downVolCount++;
    }
  }
  const avgUpVol = upVolCount > 0 ? upVolSum / upVolCount : 0;
  const avgDownVol = downVolCount > 0 ? downVolSum / downVolCount : 0;
  let volumeScore = 50;
  let volumeDetail = "insufficient data";
  if (avgUpVol > 0 && avgDownVol > 0) {
    const ratio = avgUpVol / avgDownVol;
    if (ratio >= 1.2) {
      volumeScore = 100;
      volumeDetail = `up-day volume ${ratio.toFixed(2)}x down-day — accumulation`;
    } else if (ratio >= 0.8) {
      volumeScore = 50;
      volumeDetail = `up/down volume roughly balanced (${ratio.toFixed(2)}x)`;
    } else {
      volumeScore = 0;
      volumeDetail = `up-day volume only ${ratio.toFixed(2)}x down-day — distribution`;
    }
  }
  const volume: StrengthComponent = { score: volumeScore, detail: volumeDetail };

  const weightedTotal =
    trendAlignment.score * STRENGTH_WEIGHTS.trendAlignment +
    emaDistance.score * STRENGTH_WEIGHTS.emaDistance +
    relativeStrength.score * STRENGTH_WEIGHTS.relativeStrength +
    volatility.score * STRENGTH_WEIGHTS.volatility +
    momentum.score * STRENGTH_WEIGHTS.momentum +
    volume.score * STRENGTH_WEIGHTS.volume;
  const score = Math.round(weightedTotal / 100);
  const label: StrengthLabel = score >= 70 ? "Strong" : score >= 40 ? "Neutral" : "Weak";

  const niftyCloses = niftyCandles.map((c) => c.close);
  const niftyEma200 = ema(niftyCloses, 200);
  const niftyLast = niftyCandles[niftyCandles.length - 1];
  const niftyRegime: MarketTrend =
    niftyEma200 != null && niftyLast.close > niftyEma200 ? "up" : "down";

  return {
    score,
    label,
    asOfDate: last.date,
    niftyRegime,
    components: { trendAlignment, emaDistance, relativeStrength, volatility, momentum, volume },
  };
}
