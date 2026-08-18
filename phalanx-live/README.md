# phalanx-live — daily signal automation

Folded into the TradeEdge repo so there's one repo to maintain. Fetches NSE
daily OHLCV into MongoDB Atlas and runs the Trend+RS-55 strategy against it
via GitHub Actions. This only scans — it never places orders. Results are
written to Atlas, which `trade-edge-api` reads read-only for the **Algo
Signals** page (see [docs/architecture/algo-signals.md](../docs/architecture/algo-signals.md)).

Originally a standalone repo that ran two strategies (weekly Phalanx v7 +
daily Trend+RS) side by side; only the **daily** strategy was migrated here,
since that's the one strategy actually in use going forward. If you still
have the old standalone repo around, its weekly workflow is unrelated to
this and can be retired independently.

| | |
| --- | --- |
| Schedule | Weekdays 19:00 IST |
| Rules | `core/daily_rules.py` |
| Updater | `live/update_daily.py` |
| Retention | `live/retention_daily.py`, 500 days |
| Signal generator | `live/generate_daily_signals.py` -> `daily_signals` |
| Held positions | `live/positions_daily.json` |
| Workflow | `../.github/workflows/daily_phalanx.yml` |

### Why 500 trading days of daily retention

The daily strategy's longest actual lookback is RS-55 (55 days); EMA200
(displayed only, not used in the entry/exit decision) wants ~200 bars to be
meaningful, which is the real floor. 500 days is roughly a 2.5x margin above
that floor.

## Layout

- `live/` — Atlas connection, daily OHLCV updater (tvdatafeed -> Atlas),
  retention trim, signal generator.
- `core/daily_rules.py` — entry/exit rules, self-contained (no dependency on
  the backtesting project). `core/types.py` holds the generic
  EntrySignal/Position/StrategyRules dataclasses the rules module needs.
- `live/positions_daily.json` — hand-maintained ledger of what's actually
  held right now. Starts empty. Update it yourself after placing real
  orders; nothing here does that automatically (Phase 1: signal-only).

## GitHub Secrets required

This repo's Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `ATLAS_MONGODB_URI` | Atlas connection string (same value as trade-edge-api's `PHALANX_ATLAS_MONGODB_URI`) |
| `ATLAS_DB_NAME` | `phalanx_algo` |

## Local setup

```
cd phalanx-live
pip install -r requirements.txt
cp live/.env.example live/.env   # fill in real values, gitignored

python -m live.update_daily
python -m live.retention_daily --execute
python -m live.generate_daily_signals
```
