/**
 * Exit-rule simulator — resolves a trade forward under several exit strategies
 * so we can compare them on the same entries (Connors 5-EMA vs ATR target/stop
 * vs RSI(2)>50 vs time-stop …). Pure & deterministic. LONG-only.
 *
 * Every rule reports the same shape so the analyzer can compare apples to apples:
 * exitPrice, daysHeld, retPct (% return), r (return in units of the ATR stop),
 * and resolved (false if the rule never triggered within available candles).
 */

import type { Candle } from "./journal.compute";

const round2 = (n: number) => Math.round(n * 100) / 100;

function emaSeries(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period) return out;
  const k = 2 / (period + 1);
  let e = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = e;
  for (let i = period; i < closes.length; i++) {
    e = closes[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

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
  let ag = gain / period;
  let al = loss / period;
  out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

export interface ExitOutcome {
  exitPrice: number;
  daysHeld: number;
  retPct: number;
  r: number | null;
  reason: string;
  resolved: boolean;
}

export type ExitSims = Record<string, ExitOutcome>;

export function simulateExits(
  candles: Candle[],
  entryIdx: number,
  entryPrice: number,
  atr: number,
  slMult: number,
  tgtMult: number,
): ExitSims {
  const closes = candles.map((c) => c.close);
  const ema5 = emaSeries(closes, 5);
  const rsi2 = rsiSeries(closes, 2);
  const risk = slMult * atr;
  const last = candles.length - 1;

  const mk = (
    exitPrice: number,
    exitIdx: number,
    reason: string,
    resolved = true,
  ): ExitOutcome => ({
    exitPrice: round2(exitPrice),
    daysHeld: exitIdx - entryIdx,
    retPct: round2(((exitPrice - entryPrice) / entryPrice) * 100),
    r: risk > 0 ? round2((exitPrice - entryPrice) / risk) : null,
    reason,
    resolved,
  });
  const openEnd = (reason = "open") => mk(candles[last].close, last, reason, false);

  // 1) ATR target/stop (current) — stop checked first.
  const atrRule = (): ExitOutcome => {
    const target = entryPrice + tgtMult * atr;
    const stop = entryPrice - slMult * atr;
    for (let i = entryIdx + 1; i <= last; i++) {
      if (candles[i].low <= stop) return mk(stop, i, "stop");
      if (candles[i].high >= target) return mk(target, i, "target");
    }
    return openEnd();
  };

  // 2) Connors 5-EMA close — exit on first close back above the 5-EMA. No target,
  //    optional catastrophic stop.
  const ema5Rule = (catastrophicAtr: number | null): ExitOutcome => {
    const stop = catastrophicAtr != null ? entryPrice - catastrophicAtr * atr : null;
    for (let i = entryIdx + 1; i <= last; i++) {
      if (stop != null && candles[i].low <= stop) return mk(stop, i, "stop");
      const e = ema5[i];
      if (e != null && candles[i].close > e) return mk(candles[i].close, i, "ema5");
    }
    return openEnd();
  };

  // 3) RSI(2) > 50 close exit (Connors variant) + catastrophic stop.
  const rsiRule = (): ExitOutcome => {
    const stop = entryPrice - 2 * atr;
    for (let i = entryIdx + 1; i <= last; i++) {
      if (candles[i].low <= stop) return mk(stop, i, "stop");
      const r = rsi2[i];
      if (r != null && r > 50) return mk(candles[i].close, i, "rsi>50");
    }
    return openEnd();
  };

  // 4) Time stop — exit at the close after N days (ATR stop still applies).
  const timeRule = (days: number): ExitOutcome => {
    const stop = entryPrice - slMult * atr;
    const end = Math.min(last, entryIdx + days);
    for (let i = entryIdx + 1; i <= end; i++) {
      if (candles[i].low <= stop) return mk(stop, i, "stop");
    }
    if (end <= entryIdx) return openEnd();
    return mk(candles[end].close, end, "time", end < entryIdx + days ? false : true);
  };

  // 5) Symmetric 1×ATR target / 1×ATR stop (wider stop than the 0.5× default).
  const wideRule = (): ExitOutcome => {
    const target = entryPrice + 1 * atr;
    const stop = entryPrice - 1 * atr;
    for (let i = entryIdx + 1; i <= last; i++) {
      if (candles[i].low <= stop) return mk(stop, i, "stop");
      if (candles[i].high >= target) return mk(target, i, "target");
    }
    return openEnd();
  };

  return {
    atr: atrRule(),
    ema5: ema5Rule(null),
    ema5_stop2: ema5Rule(2),
    rsi2_50: rsiRule(),
    time5: timeRule(5),
    stop1_target1: wideRule(),
  };
}
