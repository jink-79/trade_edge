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
