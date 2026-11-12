# Net Worth Tracker — Cleanup & Repurpose Plan

**Status:** Phase 1 (cleanup) done — only auth + app skeleton remain

## Intent

Turn TradeEdge (swing-trade journal + signals) into a small, mobile-first net
worth tracker. Three asset buckets only: **Mutual Funds**, **Stocks**, **Bank**.
Values are entered **once a month** — no daily fetch, no cron, no broker sync.

## What's in the repo today (~30k lines)

| Area | Contents | Verdict |
|---|---|---|
| `phalanx-live/` | Python daily OHLCV + signal generator | **Delete** |
| `.github/workflows/daily_phalanx.yml` | Weekday cron for the above | **Delete** (+ remove `ATLAS_*` repo secrets) |
| `docs/architecture/*` (6 docs) | Scanner, signals, backtest docs | **Delete** (keep `docs/README.md`) |
| API `journal` (~4k lines), `analytics`, `dashboard`, `algo-signals`, `missed-signals`, `calendar`, `weekly-recap`, `newsletter`, `preferences` | Trading features | **Delete** |
| API `config/phalanx-db.ts`, `config/phalanx-ohlcv.ts`, `middleware/cron-auth.middleware.ts` | Signals/cron plumbing | **Delete** |
| API `auth`, `middleware/*` (rest), `utils/*`, `config/db.ts`, `api/index.ts` | Express skeleton | **Keep** |
| API `mutual-funds` | Transaction ledger (date, NAV, units, amount) | **Replace** (see data model) |
| API `funds` | Cash ledger (trading/emergency/savings) | **Replace** |
| Client features: everything except `auth` | Trading UI | **Delete** |
| Client `mutual-funds` | Donut, allocation bars, formatters | Salvage `fmtINR`, donut; rest rewritten |
| Client `components/ui/*` | 70 shadcn files; **~35 are imported nowhere** | Delete unused ones |
| Client `layouts/side-bar`, `top-bar`, `global-search` | Desktop-only shell, zero responsive handling | **Replace** with mobile shell |

### Bugs found while auditing (fix or they carry over)

- `GET /api/mutual-funds` **is not scoped to the user** — it returns every
  user's entries. `userId` is optional on the model.
- CORS allow-list hardcodes `trade-edge-frontend*.vercel.app`; update on rename.
- `shadcn` is a runtime dependency; it's a CLI and belongs in devDependencies (or nowhere).

### Dependencies to drop

- **API:** `@google/generative-ai`, `resend`, `gray-matter`, `multer`, `xlsx`
  (the last three are already unused). Remove `GEMINI_*`, `RESEND_*`,
  `NEWSLETTER_*`, `CRON_SECRET`, `PHALANX_*` from `env.ts`, and the `crons`
  block from `trade-edge-api/vercel.json`. Remove the 10kb/large-body journal
  special case in `app.ts`.
- **Client:** `lightweight-charts`, `cmdk`, `embla-carousel-react`, `input-otp`,
  `react-resizable-panels`, `react-day-picker` (re-evaluate — a native
  `<input type="month">` is better on mobile). Keep `recharts`, `vaul`
  (bottom sheets on mobile), `next-themes`, `sonner`.

## Decisions

### 1. Reuse this repo, but delete first — don't refactor in place

What survives is auth + the Express/Vite skeleton (~10% of the code). Trying to
"adapt" the dashboard/analytics code to net worth would drag trading concepts
along. Plan: one commit that deletes everything listed above and still builds,
then build the new features on the empty skeleton.

Rejected: brand-new repo. It loses nothing but also gains nothing over a
tagged deletion, and you'd redo the Vercel/Atlas wiring.

### 2. Monthly **snapshots**, not transaction ledgers

The existing MF module records every purchase (NAV, units). That's the wrong
model for "update once a month": it forces you to log each SIP and still needs
a live NAV to know today's value.

New model — you enter what each account is **worth** at month end:

```
Account   { userId, name, type: 'mf' | 'stock' | 'bank', archived, createdAt }
Snapshot  { userId, accountId, month: 'YYYY-MM', value, invested?, note? }
           unique index (accountId, month)
```

- Net worth for a month = sum of that month's snapshots.
- `invested` is optional for MF/stock; when present, gain = value − invested.
- Granularity is **per account**, not per holding (e.g. "Zerodha – stocks",
  "Groww – MF", "HDFC savings"). Per-holding monthly entry is tedious enough
  that you'll stop doing it.

**Trade-off you're accepting:** snapshots can't give true returns (XIRR),
because deposits and gains are mixed together. Month-over-month change in net
worth = savings + market moves. If real returns matter, `invested` per
snapshot is the cheap approximation; full XIRR needs cash-flow records and is
out of scope.

### 3. Manual entry, no market data

"Updated once a month" = you type the numbers. No NAV API, no Kite, no cron.
A "carry forward last month" button makes the monthly update ~1 minute.

## Endpoints (new)

```
GET    /api/accounts
POST   /api/accounts
PATCH  /api/accounts/:id          (rename / archive)
GET    /api/snapshots?month=YYYY-MM
PUT    /api/snapshots/:month      (bulk upsert all accounts for a month)
GET    /api/summary               (latest net worth, by-type split, monthly series)
```

All scoped by `req.user.id`.

## UI (mobile-first)

Bottom tab bar, no sidebar, no top search:

1. **Home** — net worth headline, change vs last month, MF/Stocks/Bank split
   (donut or stacked bar), 12-month line chart.
2. **Update** — month picker + one row per account with a numeric input
   (`inputMode="decimal"`), "copy last month" button, single Save.
3. **Accounts** — list/add/archive accounts.

Login/signup stay. Desktop just centers the mobile column (`max-w-md`).

## Phases

0. **Safety net** — tag current `main` as `trade-edge-final` so the old app is
   recoverable; export the Mongo collections you care about.
1. **Delete** — everything in the "Delete" rows above; app boots with auth only;
   `npm run build` passes on both packages.
2. **Backend** — `accounts` + `snapshots` + `summary` modules, user-scoped.
3. **Frontend** — mobile shell + 3 screens.
4. **Rename & redeploy** — package names, page title, CORS regex, Vercel
   project names; drop old Atlas collections once you're sure.

## Open questions

- **Existing data:** keep the current Atlas DB (and drop trading collections
  later) or start a fresh DB? Old MF transactions can't be converted into
  monthly values without historical NAVs — seed the first snapshot by hand.
- **Multi-user?** Signup exists. If it's only you, signup could be disabled.
- **Liabilities** (loans, credit card) are out of scope as stated — but net
  worth without them is really "assets". Decide now; it's one more `type`.
- **PWA** (add to home screen, offline shell) — cheap win for mobile use.
