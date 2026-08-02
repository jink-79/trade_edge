# Pulse Weekly — v10 Pulse Breaker on the dashboard

**Status:** Phase 1 + 2 shipped (backend module + courier verified end-to-end,
data lands and reads back). Phase 3 (dashboard page) next.
**Owner:** Ajinkya
**Related:** [Scanner](scanner.md), [Backtest](scanner-backtest.md), [Filter Discovery](filter-discovery.md)
**External:** compute lives in `D:\code\pulse_trader` (a separate Python project).

## Intent

Surface the **Pulse Breaker v10** weekly strategy inside TradeEdge for visual
validation — its backtest results and each weekend's ranked order list — and make
it a place to **test filter ideas** (sector / market-cap / RS / liquidity) by
comparing backtest variants side-by-side. This is the "see it on my dashboard
before it touches a broker" step for the `pulse_trader` project.

It sits ALONGSIDE the daily Chartink Signal Lab — it does not change it.

## Why this is NOT the existing Signal Lab

The Signal Lab is **daily**: it paper-tracks Chartink signals, and the *backend*
resolves them on daily candles (RSI2/EMA features, ATR-from-Preferences, 1%-risk
sizing, unlimited concurrency, ~10-day time-stop). Pulse Breaker v10 is **weekly**
and mechanically different: 2-week breakout + RS-55 + volume + rising-SMA30 entry,
fixed **ATR 1×/2× bracket** exit on the **weekly close**, min-hold 2 weeks,
**6%-of-equity** sizing, **12-position cap**, next-Monday-open fills. Forcing v10
through the daily enrich/resolve engine would misrepresent it.

Crucially, **`pulse_trader` already owns the compute** (its `strategy/signals.py`
is verified trade-for-trade against the v10 backtest). So unlike the Chartink flow
— where the backend resolves signals — here the backend only **stores and displays
snapshots the Python side computed**. That mirrors how `scanner-backtest` already
works (`courier/backtest.py` computes → POSTs a snapshot → app renders).

## Decisions

| Decision | Chosen | Rejected / why |
|---|---|---|
| **Integration transport** | **Python → REST API (courier pattern).** `pulse_trader` posts to `/api/pulse/*`. | Shared Mongo — impossible: trade_edge's Mongo is **Atlas (cloud)**, pulse_trader's is **local**. They are different databases. |
| **Ownership of compute** | **Python computes everything** (signals, backtest, metrics, ranked orders); backend just stores/serves snapshots. | Backend re-resolves (as in Signal Lab) — wrong: the daily engine can't model weekly ATR-bracket exits; and pulse_trader is already the verified source. |
| **Collections** | **New `pulse_*` collections** (namespaced). | Reuse `scanner_*` — semantics (daily entry features, daily resolution, 1%-risk) don't fit weekly v10; would pollute the Signal Lab. |
| **Filters** | **Backtest VARIANTS.** Baseline = frozen v10 (FNO-209 or tracked-592). A filter (e.g. exclude Smallcap, min-RS, one-per-sector) is a *separate* variant pulse_trader backtests and posts; the app shows them side-by-side. Candidate-table filters are client-side views. | A live "filter toggle" that changes traded signals without a backtest — that silently changes a validated strategy. Any tradeable filter must be backtested first (reusing the IS/OOS discipline from filter-discovery). |
| **Frozen v10** | v10 stays frozen; variants are clearly labelled as experiments, never the baseline. | — |

## Data model (2 new collections)

```
pulse_runs                              // one per weekly scan run (the weekend order list)
  userId, asOf (last completed weekly date), variant (default "v10-tracked"),
  universe, universeSize, symbolsWithData, openPositions, freeSlots,
  equity, cash,
  exits:      [{ symbol, reason, close, shares, entryPrice, slPrice, tpPrice, weeksHeld }],
  candidates: [{ symbol, rank, rs55, atr, close, sector, marketCap,     // full ranked list
                 taken, shares, estEntry, estSl, estTarget, estCost }],
  createdAt, updatedAt
  // unique (userId, variant, asOf)

pulse_performance                       // latest backtest snapshot per (user, variant)
  userId, variant, label,               // e.g. "v10-tracked", "v10-no-smallcap"
  asOf, config: { universe, startingCapital, sizingPct, maxPositions,
                  atrSl, atrTp, commissionPct, filters },
  metrics: {...CAGR, Sharpe, Sortino, Calmar, PF, maxDD, winRate, ... (Mixed)},
  equityCurve:   [{ date, equity }],
  monthlyReturns:[{ month, ret }],
  benchmarkCurve:[{ date, value }],      // Nifty
  tradeCount, sampleWarning,
  createdAt, updatedAt
  // unique (userId, variant)
```

`metrics` is Mixed — its shape is owned by the Python computer (same convention as
`scanner_performance`). Keeping `variant` on both lets one user hold the baseline
plus several filter experiments at once.

## Pipelines

`pulse_trader` (local, Python) is the producer; TradeEdge stores + displays.

1. **Weekly scan** — `pulse_trader/engine` builds the ranked candidates + order
   list → courier `POST /api/pulse/scan` (upsert on user+variant+asOf).
2. **Backtest (per variant)** — `pulse_trader` runs `strategy.signals.run_backtest`
   on the variant's universe/filters, computes the metric suite + equity curve +
   Nifty benchmark → courier `POST /api/pulse/performance` (upsert on user+variant).
3. **Read** — app `GET /api/pulse/scan` (latest run) and `GET /api/pulse/performance`
   (all variants) → the Pulse page.

## Endpoints (`/api/pulse`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/pulse/scan` | Store a weekly scan run (candidates + exits + order list) |
| GET | `/api/pulse/scan` | Latest run (optional `?variant=`) |
| POST | `/api/pulse/performance` | Store/replace a variant's backtest snapshot |
| GET | `/api/pulse/performance` | List snapshots (all variants, or `?variant=`) |
| GET | `/api/pulse/variants` | Variant list + headline stats (for side-by-side) |
| POST | `/api/pulse/weeks` | Bulk-upsert a variant's per-week blotter timeline |
| GET | `/api/pulse/weeks` | Lightweight week summaries (`?variant=`) |
| GET | `/api/pulse/weeks/:date` | Full blotter for the week containing `:date` |
| POST | `/api/pulse/symbol-stats` | Store/replace a universe's per-symbol scorecard |
| GET | `/api/pulse/symbol-stats` | Latest scorecard (`?variant=tracked\|fno`) |

Auth: `authMiddleware` (JWT), same as every other module. Bodies can be large
(equity curves) → the router parses at a higher limit and is added to the
`skipLargeBody` allowlist in `app.ts`.

## Reused modules

- API utils: `asyncHandler`, `sendSuccess`/`sendCreated`, `validate`, `AppError`,
  `authMiddleware` — identical patterns to `scanner`.
- Client: dashboard `KpiCard`, recharts equity-curve (from `features/performance`),
  journal table/expandable-row patterns.
- No reuse of `journal.compute`/`journal.analytics` — those are daily-feature
  engines; v10 maths lives in `pulse_trader/strategy/signals.py` (the verified one).

## UI — `features/pulse` (new `/pulse` page, sidebar nav)

Thin page composing components (dashboard pattern):
- `pulse-kpis` — CAGR, Sharpe, MaxDD, Win%, Alpha vs Nifty (reuses `KpiCard`).
- `pulse-equity-chart` — variant equity curve vs Nifty (recharts).
- `pulse-signals-table` — this weekend's ranked candidates (rank, RS-55, close,
  ATR, sector, cap, est SL/target, TAKE) with **client-side view filters** by
  sector / cap / RS / taken-only, plus the exits list.
- `pulse-variants` — side-by-side variant comparison (baseline vs filtered):
  CAGR / MaxDD / Sharpe / Win% / trades, so a filter's effect is visible at a glance.

## Weekly Results blotter (the by-date PnL view)

A weekly strategy has a **timeline of portfolio state**, not just a signal list.
The Results view shows, for a selected week, a **blotter** of every stock in play,
each tagged by status:

- **NEW** — entered this week (prior weekly-close signal, Monday fill).
- **OPEN** — taken in an earlier week, still held (ATR bracket not hit); marked to
  that week's close (unrealized PnL moves weekly).
- **EXITED** — closed this week (weekly close crossed stop/target); realized PnL booked.

Plus a **PnL summary bar**: realized (this week's exits), unrealized (open book MTM),
equity, and counts (new / open / exits). Dates snap to the week's Monday; prev/next
navigate by week.

**All-vs-strongest radio:**
- **OFF (strongest / real book):** the actual v10 portfolio — RS-ranked, 12-cap,
  6%-equity — with carried positions and **real ₹ PnL + equity**.
- **ON (all signals):** every stock that fired the filter that week, each with its
  *independent* outcome (entry → target/stop/open, return %, notional PnL) and a
  `taken` flag — the raw opportunity set (were the skipped names better?).

### Compute & data model — precomputed in Python, dumb client

pulse_trader reconstructs the per-week blotter from the backtest **trade log +
weekly equity + Mongo OHLCV** (open = `entryDate ≤ week < exitDate`; MTM = that
week's close). This does NOT touch the parity-locked `signals.py`. "All" mode uses
an independent per-signal outcome walk (each fired signal simulated on its own).

```
pulse_weeks                             // one doc per (user, variant, week)
  userId, variant, week (Monday Date),
  equity, cash, realizedPnl, unrealizedPnl, openValue,
  counts: { new, open, exits },
  rows: [                               // capped/real book (strongest)
    { symbol, status: new|open|exited, entryDate, entryPrice, shares,
      sector, marketCap, rs, stop, target, markPrice, pnl, returnPct,
      weeksHeld, exitReason }
  ],
  allSignals: [                         // every fired signal this week (all mode)
    { symbol, rs, sector, marketCap, taken, entryPrice, outcomeStatus,
      exitDate, exitPrice, returnPct, pnlNotional, weeksHeld }
  ]
  // unique (userId, variant, week)
```

Endpoints: `POST /api/pulse/weeks` (courier bulk-upsert a variant's timeline),
`GET /api/pulse/weeks?variant=` (lightweight week summaries — no heavy arrays — for
the picker/nav), `GET /api/pulse/weeks/:date?variant=` (the full blotter for the
week containing :date, snapping to ≤ date).

**Live seam:** today every week is backtest-derived. When broker execution exists,
only the *current* week's row swaps to the live `positions` ledger; history stays
backtest-derived.

## Symbol Scorecard (per-symbol keep/review/eliminate)

The aggregate backtest snapshot (`pulse_performance`) tells you if v10 *as a whole*
works; it doesn't tell you which individual names are dragging it down. The Symbol
Scorecard re-slices the same trade log by `Symbol` and verdicts each one — same
"Python owns compute, backend just stores" pattern as `pulse_performance`.

`pulse_trader/courier/symbol_scorecard.py` runs the SAME canonical
`strategy.signals.run_backtest` engine (no forked logic), groups the closed trades
by symbol, and computes win rate / PF / Sharpe / avg-hold per symbol, then applies
simple, transparent thresholds (`MIN_TRADES_FOR_VERDICT=5`, `ELIMINATE_PF=1.0`,
`REVIEW_PF=1.3`) to tag each symbol `KEEP` / `REVIEW` / `ELIMINATE` / `TOO FEW TRADES`.

```
pulse_symbol_stats                      // latest scorecard per (user, variant)
  userId, variant ("tracked" | "fno"),  // the scorecard's universe
  strategy, universeSize, symbolsWithData,
  periodStart, periodEnd, generatedAt,
  symbols: [{ Symbol, Trades, Wins, Losses, "Win Rate %", "Net P&L (Rs)",
              "Gross Profit (Rs)", "Gross Loss (Rs)", "Total Charges (Rs)",
              "Profit Factor" (null == infinite), "Avg Trade %", "Best Trade %",
              "Worst Trade %", "Avg Hold (weeks)", "First Entry", "Last Exit",
              "Sharpe Ratio", Verdict }],
  createdAt, updatedAt
  // unique (userId, variant, generatedAt) — re-posting the same run is an upsert
```

`symbols` is Mixed, same convention as `metrics` on `pulse_performance` — shape
owned by the Python side. `python -m courier.symbol_scorecard --universe tracked`
(or `--universe fno`) writes the local Excel/JSON reports AND posts to
`/api/pulse/symbol-stats` by default (`--no-publish` to skip); `python -m
courier.publish scorecard` (or `all`) does the same from the main publish CLI.

UI: `features/pulse/pages/pulse-scorecard-page.tsx` — sortable/filterable table
(default sort Net P&L desc), Verdict color + filter, symbol search, tracked/fno
universe switch, and a client-side-only "exclude from universe" checkbox per
symbol (localStorage, doesn't touch the backtest).

## Phases

- **Phase 1 ✅ shipped** — backend `pulse` module (collections + POST/GET scan &
  performance, variants), registered in `app.ts`.
- **Phase 2 ✅ shipped** — `pulse_trader/courier` posts the weekly scan +
  backtest snapshots; verified end-to-end against the local API (scan =
  v10-tracked 21 candidates; variants v10-fno 630 trades/18.6% CAGR/-13.1% DD and
  v10-tracked 762 trades/21.4% CAGR/-31.3% DD; GET endpoints return them).
- **Phase 3** — `features/pulse` page: KPIs, equity curve vs Nifty, signals table
  with view-filters, sidebar nav.
- **Phase 4** — filter variants: pulse_trader backtests filtered universes and
  posts them; the variants panel compares them (IS/OOS discipline per
  filter-discovery to avoid overfitting).
- **Symbol Scorecard ✅ shipped** — `pulse_symbol_stats` collection + POST/GET
  `/api/pulse/symbol-stats`; courier posts per-symbol keep/review/eliminate
  verdicts (`courier/symbol_scorecard.py`, wired into `courier/publish.py`);
  `features/pulse/pages/pulse-scorecard-page.tsx` sidebar page.

## Open questions / future

- Multi-user: everything is `userId`-scoped; the courier posts as one test user.
- Data safety: the local API still points at the Atlas `MONGODB_URI`; `pulse_*`
  collections are new so they can't touch journal/scanner data, but for full
  isolation point the local API at a test DB.
- Should exits/open-position tracking eventually read the real `positions`
  collection once live trading starts (Phase 5+ of pulse_trader)?
