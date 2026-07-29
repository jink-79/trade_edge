/**
 * Trade-path analytics — MAE/MFE excursions + an exit-strategy optimizer.
 * Pure & deterministic: given the daily candles spanning a trade's life, it
 * measures how far the trade ran for/against you and replays alternative exit
 * rules to show which would have made the most on THIS trade.
 *
 * All maths assume LONG unless direction === "SHORT" (then mirrored).
 */

import type { Candle } from "./journal.compute";

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── candle indexing ───────────────────────────────────────────────────────────

function idxOnOrAfter(candles: Candle[], iso: string): number {
  const day = iso.slice(0, 10);
  const exact = candles.findIndex((c) => c.date.slice(0, 10) === day);
  if (exact !== -1) return exact;
  const t = new Date(iso).getTime();
  for (let i = 0; i < candles.length; i++) {
    if (new Date(candles[i].date).getTime() >= t) return i;
  }
  return candles.length - 1;
}

function idxOnOrBefore(candles: Candle[], iso: string): number {
  const day = iso.slice(0, 10);
  const exact = candles.findIndex((c) => c.date.slice(0, 10) === day);
  if (exact !== -1) return exact;
  const t = new Date(iso).getTime();
  let idx = candles.length - 1;
  for (let i = 0; i < candles.length; i++) {
    if (new Date(candles[i].date).getTime() <= t) idx = i;
    else break;
  }
  return idx;
}

/** Wilder RSI at every bar (nulls until it can seed). */
function rsiSeries(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// ── types ─────────────────────────────────────────────────────────────────────

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
  mfeCaptureRatio: number | null; // % of the max favourable move actually banked
  risk: number; // per-share initial risk
  actualR: number | null;
  sims: ExitSim[];
  best: { key: string; label: string; rMultiple: number | null };
  windowFrom: string;
  windowTo: string;
  computedAt: Date;
}

export interface TradePathParams {
  direction: string;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  quantity: number;
  atr14: number;
  entryDateIso: string;
  exitDateIso: string | null; // null while open
  exitPrice: number | null;
}

// ── simulation primitives ───────────────────────────────────────────────────────

interface RawExit {
  exitPrice: number;
  exitIdx: number;
  reason: string;
}

function endExit(candles: Candle[], reason = "open-end"): RawExit {
  const li = candles.length - 1;
  return { exitPrice: candles[li].close, exitIdx: li, reason };
}

/** Fixed target + stop. Stop is checked first each day (conservative). */
function walkTargetStop(
  candles: Candle[],
  eIdx: number,
  long: boolean,
  target: number,
  stop: number,
): RawExit {
  for (let i = eIdx + 1; i < candles.length; i++) {
    const c = candles[i];
    if (long) {
      if (c.low <= stop) return { exitPrice: stop, exitIdx: i, reason: "stop" };
      if (c.high >= target)
        return { exitPrice: target, exitIdx: i, reason: "target" };
    } else {
      if (c.high >= stop) return { exitPrice: stop, exitIdx: i, reason: "stop" };
      if (c.low <= target)
        return { exitPrice: target, exitIdx: i, reason: "target" };
    }
  }
  return endExit(candles);
}

/** Hard stop, then flat exit at the close after `maxDays`. */
function walkTimeStop(
  candles: Candle[],
  eIdx: number,
  long: boolean,
  stop: number,
  maxDays: number,
): RawExit {
  const end = Math.min(candles.length - 1, eIdx + maxDays);
  for (let i = eIdx + 1; i <= end; i++) {
    const c = candles[i];
    if (long && c.low <= stop) return { exitPrice: stop, exitIdx: i, reason: "stop" };
    if (!long && c.high >= stop) return { exitPrice: stop, exitIdx: i, reason: "stop" };
  }
  return { exitPrice: candles[end].close, exitIdx: end, reason: "time-stop" };
}

/** Chandelier-style trailing stop: extreme close ∓ mult×ATR. */
function walkTrail(
  candles: Candle[],
  eIdx: number,
  long: boolean,
  atr: number,
  initStop: number,
  mult: number,
): RawExit {
  let stop = initStop;
  let extreme = long ? -Infinity : Infinity;
  for (let i = eIdx + 1; i < candles.length; i++) {
    const c = candles[i];
    if (long) {
      if (c.low <= stop) return { exitPrice: stop, exitIdx: i, reason: "trail" };
      extreme = Math.max(extreme, c.close);
      stop = Math.max(stop, extreme - mult * atr);
    } else {
      if (c.high >= stop) return { exitPrice: stop, exitIdx: i, reason: "trail" };
      extreme = Math.min(extreme, c.close);
      stop = Math.min(stop, extreme + mult * atr);
    }
  }
  return endExit(candles);
}

/** Hard stop, else exit at close once RSI(2) mean-reverts past `level`. */
function walkRsiExit(
  candles: Candle[],
  eIdx: number,
  long: boolean,
  stop: number,
  rsiArr: (number | null)[],
  level: number,
): RawExit {
  for (let i = eIdx + 1; i < candles.length; i++) {
    const c = candles[i];
    if (long && c.low <= stop) return { exitPrice: stop, exitIdx: i, reason: "stop" };
    if (!long && c.high >= stop) return { exitPrice: stop, exitIdx: i, reason: "stop" };
    const r = rsiArr[i];
    if (r != null && ((long && r >= level) || (!long && r <= 100 - level))) {
      return { exitPrice: c.close, exitIdx: i, reason: "rsi-exit" };
    }
  }
  return endExit(candles);
}

// ── main ────────────────────────────────────────────────────────────────────────

export function analyzeTradePath(
  candles: Candle[],
  p: TradePathParams,
): TradeAnalytics {
  const long = p.direction !== "SHORT";
  const eIdx = idxOnOrAfter(candles, p.entryDateIso);
  const xIdx = p.exitDateIso
    ? idxOnOrBefore(candles, p.exitDateIso)
    : candles.length - 1;
  const closes = candles.map((c) => c.close);
  const rsiArr = rsiSeries(closes, 2);
  const atr = p.atr14 || 0;
  const risk = long ? p.entryPrice - p.stopPrice : p.stopPrice - p.entryPrice;

  // ── excursions over the actual holding window ──
  const from = Math.min(eIdx, xIdx);
  const to = Math.max(eIdx, xIdx);
  let hi = -Infinity;
  let lo = Infinity;
  let hiIdx = from;
  for (let i = from; i <= to; i++) {
    if (candles[i].high > hi) {
      hi = candles[i].high;
      hiIdx = i;
    }
    if (candles[i].low < lo) lo = candles[i].low;
  }
  const mfe = Math.max(0, long ? hi - p.entryPrice : p.entryPrice - lo);
  const mae = Math.max(0, long ? p.entryPrice - lo : hi - p.entryPrice);
  const realizedGain =
    p.exitPrice != null
      ? long
        ? p.exitPrice - p.entryPrice
        : p.entryPrice - p.exitPrice
      : null;
  const actualR =
    realizedGain != null && risk > 0 ? round2(realizedGain / risk) : null;

  // ── exit-strategy replays ──
  const toSim = (key: string, label: string, res: RawExit): ExitSim => {
    const pps = long
      ? res.exitPrice - p.entryPrice
      : p.entryPrice - res.exitPrice;
    return {
      key,
      label,
      exitPrice: round2(res.exitPrice),
      exitDate: candles[res.exitIdx].date,
      daysHeld: res.exitIdx - eIdx,
      reason: res.reason,
      rMultiple: risk > 0 ? round2(pps / risk) : null,
      pnl: round2(pps * p.quantity),
    };
  };

  const t = (mult: number) =>
    long ? p.entryPrice + mult * atr : p.entryPrice - mult * atr;

  const sims: ExitSim[] = [
    toSim(
      "plan",
      "Your plan (target/SL)",
      walkTargetStop(candles, eIdx, long, p.targetPrice, p.stopPrice),
    ),
    toSim(
      "t15",
      "Target 1.5×ATR",
      walkTargetStop(candles, eIdx, long, t(1.5), p.stopPrice),
    ),
    toSim(
      "t2",
      "Target 2×ATR",
      walkTargetStop(candles, eIdx, long, t(2), p.stopPrice),
    ),
    toSim(
      "time5",
      "Time stop · 5 days",
      walkTimeStop(candles, eIdx, long, p.stopPrice, 5),
    ),
    toSim(
      "trail1",
      "Trailing 1×ATR",
      walkTrail(candles, eIdx, long, atr, p.stopPrice, 1),
    ),
    toSim(
      "rsi50",
      "RSI(2) > 50 exit",
      walkRsiExit(candles, eIdx, long, p.stopPrice, rsiArr, 50),
    ),
    toSim("hold", "Hold to latest", endExit(candles, "latest")),
  ];

  const best = sims.reduce((a, b) =>
    (b.rMultiple ?? -Infinity) > (a.rMultiple ?? -Infinity) ? b : a,
  );

  return {
    mae: round2(mae),
    maePct: round2((mae / p.entryPrice) * 100),
    maeR: risk > 0 ? round2(mae / risk) : null,
    mfe: round2(mfe),
    mfePct: round2((mfe / p.entryPrice) * 100),
    mfeR: risk > 0 ? round2(mfe / risk) : null,
    daysToMfe: hiIdx - eIdx,
    mfeCaptureRatio:
      realizedGain != null && mfe > 0
        ? round2((realizedGain / mfe) * 100)
        : null,
    risk: round2(risk),
    actualR,
    sims,
    best: { key: best.key, label: best.label, rMultiple: best.rMultiple },
    windowFrom: candles[eIdx].date,
    windowTo: candles[candles.length - 1].date,
    computedAt: new Date(),
  };
}
