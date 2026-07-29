# Scanner — "Signal Lab"

**Status:** Planned (Phase 1 not yet built)
**Owner:** Ajinkya
**Related:** [Journal](../README.md), Ranking system (future)

## Intent

Every night the user runs a Chartink filter (their strategy scanner) that
returns many stocks. They do **not** trade all of them — but each one is a
data point. The Signal Lab turns every Chartink signal into a **paper trade**,
lets it play out over the following days, and resolves it as TARGET / STOP /
TIMEOUT. Aggregated over hundreds of signals, it reveals **what winners have in
common vs losers** — so real-money stock selection gets sharper.

This is pure research: no real orders, no advice. It also produces the labeled
dataset that will train the **Ranking system** (features → outcomes).

## Decisions

| Decision | Chosen | Rejected / why |
|---|---|---|
| **Entry model** | **Scan-day close** — `entryPrice = close(scanDate)`; indicators computed at that candle; target/SL from Preferences ATR multipliers. | Next-day open (more realistic but more moving parts); next-day close (too conservative). User chose scan-day close for simplicity. |
| **Candle fetch** | **Phase 1: manual / agent-assisted** — enrich endpoint takes candles in the body (supplied via Kite MCP or a manual run). **Phase 2: Python courier** — a local script with a Kite token hits the same endpoints nightly. | Server-side Kite fetch — impossible; the Vercel backend holds no interactive broker session. |
| **Placement / scope** | **New `/scanner` page, phased.** Phase 1 = paste → track → resolve. Phase 2 = winner-vs-loser insight panel + dashboard widget. | Dashboard-only section (too small for a research tool); all-at-once (bigger risky build). |
| **Max hold** | Time-stop after ~10 trading days → TIMEOUT (constant for now; move to Preferences later). | — |

## Data model (2 new collections)

```
scanner_batches                       // one per nightly paste
  _id, userId, scanDate, source: "chartink",
  rawInput, symbolCount, note, createdAt

scanner_signals                       // one per stock per scanDate
  _id, userId, batchId, symbol, scanDate,
  status: OPEN | TARGET | STOP | TIMEOUT,     // OPEN until enriched/resolved
  entry: {                                    // filled at first enrich (reuses journal.compute)
    entryDate, entryPrice, atr14, targetPrice, stopPrice,
    rsi2, distanceFrom200Ema, distanceTo50Ema, pullbackDepth,
    candlesFromHigh, entryCandleClose, downMoveVolume, sector,
    niftyVs200Ema, niftyRsi2, gappedIntoEntry
  } | null,
  tracking: { lastPrice, lastDate, mae, mfe, daysHeld },
  result: {                                   // filled on resolution (reuses journal.analytics)
    outcome, exitPrice, exitDate, daysToResolve, rMultiple, mfeR, maeR
  } | null,
  createdAt, updatedAt
```

`entry` uses the **same feature set** as real journal trades, so paper signals
and real trades are directly comparable and feed one insight engine.

## Pipelines

### 1. Ingest — `POST /api/scanner/batch { scanDate, symbols[] }`
Parse the paste → create a batch + one `OPEN` signal per symbol. No compute
yet (candles not present).

### 2. Enrich / resolve — `POST /api/scanner/signals/:id/enrich { candles, indexCandles }`
Idempotent; safe to re-run nightly.
- **First touch:** compute the entry snapshot (indicators via `journal.compute`;
  target = `close + tgtMult*ATR`, stop = `close - slMult*ATR` from Preferences).
- **Each run:** walk candles from the day **after** scanDate:
  `low ≤ stop → STOP`, `high ≥ target → TARGET`, else continue; update MAE/MFE;
  after `maxHoldDays` → `TIMEOUT`. Reuses the `walkTargetStop` logic from
  `journal.analytics.ts`. Resolve with `rMultiple`, `mae/mfe`.

### 3. Insights — `GET /api/scanner/insights` (Phase 2)
Across resolved signals:
- Cohort stats: hit-target %, hit-SL %, timeout %, avg R, expectancy, avg
  days-to-resolve.
- **Winner-vs-loser split** per feature (RSI(2) bucket, pullback depth,
  distance-from-200-EMA, sector, Nifty regime, gap, volume character):
  win rate + avg R. *This is the "what do winners share" answer.*

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/scanner/batch` | Create a batch from a pasted symbol list |
| GET | `/api/scanner/signals` | List signals (filter by status/batch) |
| GET | `/api/scanner/signals/active` | Open signals needing candles (courier reads this) |
| POST | `/api/scanner/signals/:id/enrich` | Supply candles → compute entry + resolve |
| GET | `/api/scanner/stats` | Cohort KPIs (Phase 1: basic; Phase 2: full insights) |

## Reused modules

- `journal.compute.ts` — `computeEntryIndicators`, `computeRegime`.
- `journal.analytics.ts` — forward-walk target/stop resolution + MAE/MFE.
- `preferences.service.ts` — ATR multipliers, (future) max-hold.
- Client `KpiCard` (dashboard), table/expandable-row patterns (journal).

## UI — `features/scanner`

Thin page composing components (dashboard pattern):
- `scanner-hero`, `scanner-paste-card` (textarea + scan-date → "Track these")
- `scanner-kpis` (tracking / hit-target % / hit-SL % / avg R — reuses `KpiCard`)
- `active-signals-table` (symbol, entry, target/SL, status, days held, live R/MFE)
- `resolved-signals-table`
- **Phase 2:** `scanner-insights` panel + a compact dashboard widget

Route `/scanner`; add a sidebar nav link.

## Phases

- **Phase 1** — collections, ingest, enrich/resolve, `/scanner` page with
  paste + active/resolved tables + basic KPIs. Candles supplied manually/agent.
- **Phase 2** — winner-vs-loser insight panel, dashboard widget, **Python
  courier** for automated nightly candle fetch.
- **Phase 3** — feed the labeled dataset into the **Ranking system** so real
  picks go to the highest-probability setups. (The flywheel: Lab → weights →
  better picks.)

## Open questions / future

- Move `maxHoldDays` and paper target/SL multipliers into Preferences.
- Instrument-token resolution for symbols (needed by the courier) — cache a
  symbol→token map.
- De-dup: the same stock can fire on consecutive nights — decide whether to
  track each occurrence or collapse.
- Chartink paste format: plain symbols vs full CSV with columns — the ingest
  parser should tolerate both.
