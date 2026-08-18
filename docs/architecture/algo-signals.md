# Algo Signals — architecture

Status: **design → build**. Read-only viewer inside TradeEdge for the output of
**phalanx-live**, a separate GitHub repo that runs on a schedule (GitHub
Actions), computes NSE trading signals, and writes results into its own
MongoDB Atlas cluster. TradeEdge never writes to that cluster — this feature
exists purely to validate the signal engine's output visually.

```
phalanx-live (separate repo, GitHub Actions cron)
   │  computes signals against NSE data
   ▼
Atlas cluster "phalanx" — collections: daily_signals, weekly_signals
   │  read-only
   ▼
trade-edge-api  (new Mongoose connection, separate from the primary DB)
   │  GET /api/algo-signals/daily/*, /weekly/*
   ▼
client  "Algo Signals" page (nav item, table-heavy, no writes)
```

Held positions live in a hand-maintained JSON file inside phalanx-live
(`live/positions_daily.json` / `live/positions.json`) — **not** in Atlas, and
**not** reconciled with TradeEdge's own `live_positions`/trades data. This UI
shows what phalanx-live produced, nothing more; reconciliation is a separate
future integration.

---

## Why a second Mongo connection

TradeEdge's primary DB connection (`config/db.ts`, `connectDB()`) points at
its own Atlas cluster via `MONGODB_URI` and binds all existing models to
Mongoose's **default connection**. phalanx-live's data lives on a different
cluster entirely, so this feature opens a **second, independent connection**
(`config/phalanx-db.ts`, `connectPhalanxDB()`) via `mongoose.createConnection()`,
using its own env vars:

- `PHALANX_ATLAS_MONGODB_URI` — connection string for the phalanx cluster
- `PHALANX_ATLAS_DB_NAME` — db name on that cluster

Both are optional in `env.ts` (unset in local dev unless a developer is
specifically testing this feature). If unset, the algo-signals routes return
a `503` explaining the feature isn't configured, rather than crashing the
whole API.

Models for `daily_signals`/`weekly_signals` are created against this second
connection (`phalanxConn.model(...)`), never the default one — makes it
structurally impossible for a stray `model()` call elsewhere in the codebase
to accidentally target the phalanx cluster, and vice versa.

---

## Data contracts (read as-is, no transformation of meaning)

### `daily_signals` (Trend+RS, the priority) — one doc per `reference_date`

```jsonc
{
  "reference_date": "2026-08-20T00:00:00Z",
  "generated_at": "2026-08-20T13:35:12Z",
  "held_before": ["RELIANCE", "TCS"],
  "exits": ["TCS"],
  "capital": 500000,
  "max_positions": 5,
  "slot_size": 100000,
  "free_slots_after_exits": 4,
  "to_buy_sized": [{ "symbol": "HEG", "ref_price": 318.6, "qty": 313, "amount": 99721.8 }],
  "buy_candidates_ranked": [{ "symbol": "HEG", "rs55_pct": 12.4 }, { "symbol": "TANLA", "rs55_pct": 9.8 }],
  "to_buy": ["HEG"],
  "stale_symbols": []
}
```

- `exits` ⊆ `held_before` — trend flipped down, sell signal.
- `buy_candidates_ranked` — every symbol that passed the entry rule today,
  ranked by `rs55_pct` desc; can be longer than `free_slots_after_exits`.
- `to_buy` — top-ranked slice of `buy_candidates_ranked`, truncated to
  `free_slots_after_exits`.
- `to_buy_sized` — `to_buy` with qty/amount computed against `slot_size`.
- `stale_symbols` — symbols skipped this run (stale price data).

### `weekly_signals` (Phalanx v7) — one doc per `reference_week`

Same shape, analogous fields: `breakout_strength_pct` replaces `rs55_pct`,
no `to_buy_sized` (weekly strategy doesn't emit sized orders the same way).
Rendered with the same components, field-mapped.

Both collections are upserted (never duplicated) by phalanx-live, so a
`reference_date`/`reference_week` is a stable natural key — TradeEdge reads
by it directly, no need for its own id scheme.

---

## Module layout (`trade-edge-api/src/modules/algo-signals/`)

| File | Responsibility |
|---|---|
| `algo-signals.types.ts` | TS types mirroring the phalanx-live doc shapes (no Zod validation needed — we don't write, and we render defensively) |
| `algo-signals.model.ts` | Mongoose models bound to the **phalanx connection**, collections `daily_signals` / `weekly_signals` |
| `algo-signals.service.ts` | Read-only queries: latest doc, range query |
| `algo-signals.controller.ts` | Express handlers |
| `algo-signals.routes.ts` | Route table, mounted `app.use("/api/algo-signals", …)` behind `authMiddleware` |

## API surface

| Method + path | Purpose |
|---|---|
| `GET /api/algo-signals/daily/latest` | Most recent `daily_signals` doc (or `null`) |
| `GET /api/algo-signals/daily?from=&to=&limit=` | Docs in a date range, newest first, for history browsing |
| `GET /api/algo-signals/weekly/latest` | Most recent `weekly_signals` doc (or `null`) |
| `GET /api/algo-signals/weekly?from=&to=&limit=` | Weekly docs in a range |

All GET-only; no POST/PUT/DELETE against the phalanx cluster from TradeEdge,
enforced simply by not writing any mutating route or model method.

---

## Frontend (`client/src/features/algo-signals/`)

New nav item **"Algo Signals"** → `/algo-signals`. Table-heavy, matches
existing TradeEdge UI primitives (`Table`, `Badge`, `Card`-style section
wrappers as used in `features/pulse`), no new visual patterns.

Sections, top to bottom:

1. **Today's summary** — reference date, capital, max positions, free slots
   after exits, generated-at timestamp.
2. **Exits table** — symbol + red "SELL" badge; empty state if none.
3. **Entry candidates table** — full `buy_candidates_ranked`, ranked by
   `rs55_pct`; top `free_slots_after_exits` rows highlighted/pinned with
   qty + amount from `to_buy_sized`; remaining rows shown greyed out under a
   "did not make the cut" divider rather than dropped.
4. **Stale symbols** — small collapsed secondary list (badge count + expand).
5. **History view** — date-range picker over `GET /daily?from=&to=`, list of
   past days, click to load that day's doc into the same components above.

Weekly is rendered by the same components with a variant toggle if built;
daily ships first per the brief.

---

## Env & secrets

Add to `config/env.ts` (zod, both optional):

```
PHALANX_ATLAS_MONGODB_URI   z.string().optional()
PHALANX_ATLAS_DB_NAME       z.string().optional()
```

Connection string supplied out of band (never hardcoded, never committed).

---

## Explicitly out of scope

- Writing to the phalanx Atlas cluster from TradeEdge.
- Reconciling `daily_signals`/`weekly_signals` against TradeEdge's own
  positions/trades data.
- Any change to phalanx-live itself.
