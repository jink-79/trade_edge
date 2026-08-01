# Support & Bounce Indicator

**Status:** building Phase 1 (features) now
**Related:** [Filter Discovery](filter-discovery.md), [Scanner](scanner.md), Ranking (future)

## Intent

A composite that answers "**is this stock at a level where a bounce is likely,
and how likely?**" — the sophisticated version of the walk-forward-validated
"pullback ≥15%" edge. It locates support (structure / EMA / Fib / gap), measures
**confluence** (how many supports stack here), adds **reversal confirmation**
(candlestick / Heikin Ashi), and turns it into a **bounce probability calibrated
on our 2,400 labeled paper trades** — not a guessed number.

## Design (all from daily OHLCV we already fetch)

**Locate support**
- **Structure** — pivot-low detection → nearest level below + # times tested.
- **EMA** — distance to 20/50/200 EMA; how many sit within ~1 ATR (confluence);
  price on a rising 50-EMA.
- **Fibonacci** — 38.2/50/61.8% retracement of the last up-swing; nearest level.
- **Gap** — unfilled gap-ups below (revisited & held = support).
- (Round numbers — cheap extra.)

**Confluence** — count/weight supports within ~1 ATR of price. The core signal.

**Reversal confirmation**
- Lower-wick rejection ratio; hammer; bullish engulfing.
- **Heikin Ashi exhaustion** — run of red HA with shrinking bodies → turn.
- RSI(2) oversold + volume (already captured).

## Scoring — data-calibrated

1. Phase 1: compute all the raw features, store them on each scanner signal's
   `entry.support` (the scanner `entry` is Mixed, so no schema change).
2. Phase 2: re-enrich (a courier run now refreshes the entry snapshot on **all**
   signals, not just open ones — see below), then `analyze.py` shows which
   support features actually predict wins.
3. Phase 3: fit a logistic model on outcomes → **calibrated bounce probability**,
   walk-forward validated. Becomes a filter gate + ranking input.

## Compute location

`trade-edge-api/src/modules/journal/journal.support.ts` — pure
`computeSupportFeatures(candles, entryIdx, atr)`. Called by scanner
`applyEnrichment`; result stored at `entry.support`.

## Backfill note

To calibrate on the already-resolved 2,400 trades, `applyEnrichment` now
recomputes the **entry snapshot for every signal** (adding support features) but
only **resolves** ones still `OPEN` — so a normal courier re-run backfills the
new features onto historical trades without disturbing their outcomes.

## Phases
- **P1 (now)** — support-feature compute + store on `entry.support`.
- **P2** — re-enrich + calibrate via `analyze.py` (which features matter).
- **P3** — logistic bounce-probability model + filter/ranking integration.
