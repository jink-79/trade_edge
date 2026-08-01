# Filter Discovery — winner/loser analysis

**Status:** building now
**Related:** [Scanner](scanner.md), [Backtest](scanner-backtest.md)

## Intent

Crunch the resolved paper-trade log to find **what separates winners from
losers**, and derive **filters that cut the losing trades** — turning the
breakeven raw strategy into a positive-expectancy one. The output guides both
the Chartink scan (what to stop scanning) and the future ranking system.

## The discipline (anti-overfitting)

With ~2,400 trades and a dozen features, brute-forcing "best combination" finds
**noise**. So the script:

1. **Splits by date** — in-sample = earliest ~70% of scan dates, out-of-sample
   = latest ~30%. Filters are *derived on IS only* (e.g., which sectors win),
   then *validated on OOS*.
2. **Only trusts filters positive on BOTH** IS and OOS, with a **minimum trade
   count** (noise floor).
3. Tests a **curated set of candidate gates** + up to 3-way combos — not a full
   2^N sweep (that's the curve-fit trap).

## What it computes

- **Single-feature breakdown** — win% / expectancy / profit factor per bucket
  (sector, market-cap, regime, RSI2, dist-200/50-EMA, pullback, volume, gap,
  candle-close, candles-from-high), with lift vs baseline.
- **Winner-vs-loser profile** — mean of each numeric feature for winners vs
  losers.
- **Filter search** — candidate gates (sector-whitelist-from-IS, regime,
  market-cap, RSI, pullback, extension, candle-close, volume) combined 1–3 deep;
  ranked by **OOS expectancy** subject to IS>0 and N ≥ floor.

## Output

`courier/analyze.py` → console report + `analyze_report.json`. Reads resolved
signals from `GET /scanner/signals`. Later: the best validated gates feed the
in-app Insights panel and the ranking system.

## Notes

- Sector whitelist is **derived on in-sample only** (no leakage), then tested on
  OOS — the honest way to use a 26-level categorical.
- Everything is on the current daily-candle, stop-first resolution — a known
  slight pessimistic bias on fast 1-day trades.
