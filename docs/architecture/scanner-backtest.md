# Scanner Backtest — "Real-time Backtesting"

**Status:** Phase 1 shipped — snapshot endpoints, `courier/backtest.py` metric
engine, and the `/performance` dashboard. Phase 2 (capped variant + MTM daily
equity) pending.
**Owner:** Ajinkya
**Related:** [Scanner](scanner.md), Ranking system (future)

## Intent

Turn the accumulating pool of resolved paper signals into a **growing backtest**
that is recomputed every night. As more signals resolve, the strategy's stats
(CAGR, Sharpe, drawdown, win rate, alpha vs Nifty …) mature — a live,
ever-expanding backtest of the Chartink filter rather than a fixed historical
window. Goal: a quantified read on whether the filter has a real, tradeable edge.

## Decisions

| Decision | Chosen | Notes |
|---|---|---|
| **Position sizing** | **Fixed 1% risk per trade.** size = (0.01 × equity) ÷ (entry − stop). So each trade's equity return = `0.01 × R`. | Matches Preferences; R-multiples map straight to returns. |
| **Concurrency** | **Unlimited (raw edge).** Every resolved signal counts; no capacity cap. | Measures the filter's pure statistical edge. CAGR is "if you could take them all." A capped/tradeable variant is a later add. |
| **Equity curve** | **Closed-trade, compounded, booked on exit date.** Sort resolved trades by exit; `equity *= (1 + 0.01 × R)`. | Standard trade-log method. Overlaps approximated as sequential. Mark-to-market daily is a future refinement for intra-trade DD. |
| **Delivery** | **Python computes → POST snapshot to backend → in-app Performance dashboard.** | Python (pandas/numpy) is the right tool; the app just displays the latest snapshot. |
| **Starting capital / benchmark / rf** | ₹7,00,000 · Nifty 50 · risk-free 0% (configurable). | |

## Compute model (all from the closed-equity curve + trade log)

Trade log = resolved signals (`TARGET`/`STOP`/`TIMEOUT`) with `rMultiple`,
`entryDate`, `exitDate`, `daysToResolve`, symbol, sector, entry features.

- **Equity curve:** start ₹7L; per trade (exit order) `equity *= 1 + 0.01·R`.
  Expand to a **daily** series (forward-fill) for drawdown maths.
- **Returns:** Total Return, CAGR `(end/start)^(365/spanDays) − 1`, ~Trades/yr.
- **Risk (daily curve):** Max DD, Avg DD, Max DD Duration, Annualized Vol
  (from monthly returns × √12).
- **Ratios:** Sharpe & Sortino (monthly mean ÷ std[/downside std] × √12),
  Calmar (CAGR ÷ |MaxDD|), Profit Factor (Σ win-R ÷ |Σ loss-R|), R:R (avg-win-R
  ÷ |avg-loss-R|).
- **Trade stats:** Total, Win %, Loss %, Best, Worst, Avg Duration, Avg Win,
  Avg Loss, Expectancy (mean R), Longest Losing Streak, Max Consecutive Wins.
- **Benchmark (Nifty, fetched via tvdatafeed):** Nifty CAGR, Buy&Hold equal-weight
  return (avg of last/entry − 1 across signals), Alpha = strat CAGR − Nifty CAGR.
- **Robustness:** monthly-returns table; OOS/IS ratio (2nd-half vs 1st-half avg
  return by date) — flagged noisy until the sample grows.

## Data model

```
scanner_performance                    // latest snapshot per user (history optional)
  userId, asOf, computedAt,
  config: { startingCapital, riskPerTrade, benchmark },
  metrics: { ...all scalars above... },
  equityCurve: [{ date, equity }],
  monthlyReturns: [{ month, ret }],
  benchmarkCurve: [{ date, value }],
  tradeCount, sampleWarning: string|null
```
`metrics` etc. stored as Mixed (the shape is owned by the Python computer).

## Pipelines

1. **Compute** — `courier/backtest.py` (after nightly enrich): `GET /scanner/signals`
   → build trade log → fetch Nifty via tvdatafeed → compute everything →
   `POST /scanner/performance` (+ write a local `report.json`/`.csv`).
2. **Read** — app `GET /scanner/performance` → Performance dashboard.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/scanner/performance` | Store the nightly snapshot (courier) |
| GET | `/api/scanner/performance` | Latest snapshot (app) |

## UI — `features/performance`

New `/performance` page (thin, dashboard-style): metric cards grouped
Returns / Risk / Ratios / Trades / Robustness, an **equity-curve chart** vs
Nifty, and a **monthly-returns** strip. Reuses recharts + dashboard `KpiCard`.
Sidebar nav link. Shows a "sample still small" banner while trade count is low.

## Phases

- **Phase 1 ✅ shipped** — backend snapshot endpoints
  (`POST`/`GET /scanner/performance`), `courier/backtest.py` (full metric suite,
  unlimited / 1%-risk model, Nifty benchmark, writes report.json + posts), and
  the `/performance` dashboard (KPIs, equity curve vs Nifty, grouped metrics,
  monthly returns) with sidebar nav.
- **Phase 2** — capped/tradeable variant side-by-side; mark-to-market daily
  equity for true intra-trade drawdown; risk-free input.
- **Phase 3** — feed into the ranking system (which features drive the edge).

## Open questions / future

- Small-sample caveat: with days of data the metrics are noisy; the UI must say
  so. Metrics stabilize as the cohort matures (that's the "real-time" part).
- Include still-open signals via mark-to-market (Phase 2) vs resolved-only (now).
