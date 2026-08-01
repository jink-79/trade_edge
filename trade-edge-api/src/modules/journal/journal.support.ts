/**
 * Support & bounce features — where is price relative to support, and are there
 * reversal signs? Pure & deterministic, evaluated AT the entry candle.
 *
 * These are the raw features; the bounce PROBABILITY is calibrated later on
 * labeled outcomes (see docs/architecture/support-indicator.md).
 */

import type { Candle } from "./journal.compute";

const round2 = (n: number) => Math.round(n * 100) / 100;

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

/** Pivot lows: a bar whose low is the min of its ±k neighbourhood. */
function pivotLows(candles: Candle[], upto: number, k = 3, lookback = 120): number[] {
  const from = Math.max(k, upto - lookback);
  const lows: number[] = [];
  for (let i = from; i <= upto - k; i++) {
    const lo = candles[i].low;
    let isPivot = true;
    for (let j = i - k; j <= i + k; j++) {
      if (j !== i && candles[j].low < lo) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) lows.push(lo);
  }
  return lows;
}

/** Heikin-Ashi close/open series. */
function heikinAshi(candles: Candle[]): { o: number; c: number }[] {
  const ha: { o: number; c: number }[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen =
      i === 0 ? (c.open + c.close) / 2 : (ha[i - 1].o + ha[i - 1].c) / 2;
    ha.push({ o: haOpen, c: haClose });
  }
  return ha;
}

export interface SupportFeatures {
  // structure
  nearestSupportPct: number; // % below entry to nearest pivot-low support (0 if none)
  nearestSupportAtr: number; // same, in ATR units
  supportTouches: number; // pivots clustered near that level
  // EMA
  emaConfluence: number; // # of 20/50/200 EMAs within 1 ATR at/below price
  onRising50Ema: boolean;
  distTo50Ema: number; // %
  // reversal confirmation (entry candle)
  lowerWickRatio: number; // lower shadow / range
  hammer: boolean;
  bullishEngulfing: boolean;
  haExhaustion: boolean; // downtrend HA running out of steam
  // fib + gap
  nearestFibPct: number; // % distance to nearest 38/50/62 retracement (999 if n/a)
  atFib: boolean;
  gapSupportBelow: boolean;
  // aggregate (pre-calibration heuristic)
  confluenceCount: number; // 0–5 support types within ~1 ATR
  bounceScoreRaw: number; // 0–100 heuristic until calibrated
}

export function computeSupportFeatures(
  candles: Candle[],
  entryIdx: number,
  atr: number,
): SupportFeatures {
  const e = candles[entryIdx];
  const price = e.close;
  const closes = candles.slice(0, entryIdx + 1).map((c) => c.close);
  const band = Math.max(atr, price * 0.005); // ~1 ATR (floor 0.5%)

  // ── structure ──
  const pivots = pivotLows(candles, entryIdx).filter((l) => l <= price);
  let nearest = 0;
  let touches = 0;
  if (pivots.length) {
    nearest = Math.max(...pivots); // highest pivot below price = nearest support
    const tol = Math.max(atr * 0.75, price * 0.015);
    touches = pivots.filter((l) => Math.abs(l - nearest) <= tol).length;
  }
  const nearestSupportPct = nearest ? round2(((price - nearest) / price) * 100) : 0;
  const nearestSupportAtr = nearest && atr > 0 ? round2((price - nearest) / atr) : 0;

  // ── EMA confluence ──
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const emas = [ema20, ema50, ema200].filter((v): v is number => v != null);
  // an EMA is "support" if it sits at/below price within a band
  const emaConfluence = emas.filter((v) => v <= price + band * 0.2 && v >= price - band).length;
  const ema50Prev = ema(closes.slice(0, closes.length - 5), 50);
  const onRising50Ema =
    ema50 != null &&
    ema50Prev != null &&
    ema50 > ema50Prev &&
    Math.abs(price - ema50) <= band;
  const distTo50Ema = ema50 != null ? round2(((price - ema50) / ema50) * 100) : 0;

  // ── reversal confirmation (entry candle) ──
  const range = e.high - e.low || 1;
  const body = Math.abs(e.close - e.open);
  const lowerWick = Math.min(e.open, e.close) - e.low;
  const lowerWickRatio = round2(lowerWick / range);
  const hammer =
    body <= range * 0.4 && lowerWick >= body * 2 && e.close >= e.low + range * 0.5;
  const prev = candles[entryIdx - 1];
  const bullishEngulfing =
    !!prev &&
    prev.close < prev.open &&
    e.close > e.open &&
    e.close >= prev.open &&
    e.open <= prev.close;

  // Heikin-Ashi exhaustion: prior bars were red HA, entry HA turning / shrinking.
  const ha = heikinAshi(candles.slice(0, entryIdx + 1));
  let haExhaustion = false;
  if (ha.length >= 4) {
    const last = ha[ha.length - 1];
    const p1 = ha[ha.length - 2];
    const p2 = ha[ha.length - 3];
    const redBefore = p1.c < p1.o && p2.c < p2.o;
    const lastBody = Math.abs(last.c - last.o);
    const prevBody = Math.abs(p1.c - p1.o);
    haExhaustion = redBefore && (last.c >= last.o || lastBody < prevBody * 0.6);
  }

  // ── fibonacci (retracement of the last up-swing) ──
  const from = Math.max(0, entryIdx - 60);
  let swingLow = Infinity;
  let swingLowIdx = from;
  for (let i = from; i <= entryIdx; i++)
    if (candles[i].low < swingLow) {
      swingLow = candles[i].low;
      swingLowIdx = i;
    }
  let swingHigh = -Infinity;
  for (let i = from; i <= swingLowIdx; i++)
    if (candles[i].high > swingHigh) swingHigh = candles[i].high;
  let nearestFibPct = 999;
  if (swingHigh > swingLow && Number.isFinite(swingHigh)) {
    const rng = swingHigh - swingLow;
    const levels = [0.382, 0.5, 0.618].map((r) => swingHigh - r * rng);
    nearestFibPct = round2(
      Math.min(...levels.map((l) => (Math.abs(price - l) / price) * 100)),
    );
  }
  const atFib = nearestFibPct <= 1.5;

  // ── gap support (unfilled gap-up below price) ──
  let gapSupportBelow = false;
  for (let i = Math.max(1, entryIdx - 60); i <= entryIdx; i++) {
    if (candles[i].low > candles[i - 1].high) {
      const gapTop = candles[i].low;
      const gapBot = candles[i - 1].high;
      // still below price and not since traded through the bottom
      if (gapBot < price && price - gapBot <= band * 2) {
        gapSupportBelow = true;
        break;
      }
    }
  }

  // ── confluence + raw heuristic score ──
  const nearSwing = nearest > 0 && price - nearest <= band;
  const nearFib = atFib;
  const nearRound = (() => {
    const step = price >= 1000 ? 100 : price >= 200 ? 50 : 10;
    const below = Math.floor(price / step) * step;
    return price - below <= band && below > 0;
  })();
  const confluenceCount =
    (nearSwing ? 1 : 0) +
    (emaConfluence > 0 ? 1 : 0) +
    (nearFib ? 1 : 0) +
    (gapSupportBelow ? 1 : 0) +
    (nearRound ? 1 : 0);

  const confirm =
    (hammer ? 1 : 0) +
    (bullishEngulfing ? 1 : 0) +
    (haExhaustion ? 1 : 0) +
    (lowerWickRatio >= 0.4 ? 1 : 0);
  // Heuristic 0–100: confluence 40, proximity 25, EMA 15, confirmation 20.
  const proximity =
    nearestSupportAtr > 0 ? Math.max(0, 1 - nearestSupportAtr / 3) : 0.3;
  const bounceScoreRaw = Math.round(
    Math.min(
      100,
      confluenceCount * 8 +
        proximity * 25 +
        emaConfluence * 5 +
        confirm * 5,
    ),
  );

  return {
    nearestSupportPct,
    nearestSupportAtr,
    supportTouches: touches,
    emaConfluence,
    onRising50Ema,
    distTo50Ema,
    lowerWickRatio,
    hammer,
    bullishEngulfing,
    haExhaustion,
    nearestFibPct,
    atFib,
    gapSupportBelow,
    confluenceCount,
    bounceScoreRaw,
  };
}
