# TradeEdge — Docs

Architecture-first workflow. **Before building any feature, we write an
architecture doc here.** Before planning a *new* feature, we re-read the
relevant docs so context is never lost between sessions.

## How we work

1. **Design** → capture the architecture in `docs/architecture/<feature>.md`
   using the template below.
2. **Decide** → record the key decisions (and the options rejected) in the doc.
3. **Build** → implement in phases; keep the doc's "Status" section current.
4. **Revisit** → when a new feature touches an existing one, read its doc first.

## Doc template

Every architecture doc should have:

- **Intent** — what problem it solves, in one paragraph.
- **Decisions** — the forks taken, with the rejected options and why.
- **Data model** — collections/tables and their shape.
- **Pipelines / flows** — how data moves (ingest → process → read).
- **Endpoints** — the API surface.
- **Reused modules** — what existing code it leans on.
- **UI** — pages/components.
- **Phases** — what ships when.
- **Status** — Planned / In progress / Shipped, updated as we go.
- **Open questions / future** — deferred work.

## Stack (quick reference)

- **Client** — React 19 + Vite + TanStack Query + shadcn/ui + Tailwind.
  Feature-slice layout: `features/<name>/{api,components,hooks,pages,types}`.
  Thin pages compose components (see `features/dashboard`).
- **API** — Express 5 + Mongoose + Zod 4 + JWT. Module layout:
  `modules/<name>/<name>.{model,service,controller,routes,types}.ts`.
  Envelope `{ success, message, data }`; `sendSuccess` / `AppError` / `validate`.
- **Data** — Kite (Zerodha) daily OHLCV; indicators computed in
  `journal.compute.ts`; MAE/MFE + exit sims in `journal.analytics.ts`.
  Kite login is interactive — the server holds no broker token, so candle
  fetches are supplied in request bodies (agent now, Python courier later).

## Index

### Architecture docs
- [Scanner (Signal Lab)](architecture/scanner.md) — **Planned** — paper-track
  every Chartink signal to learn winner vs loser characteristics.

### Shipped features (docs to backfill)
- **Journal** — trade capture merged into `openpositions` / `closedpositions`;
  auto-capture from Kite; Open Positions & Trade History pages; trade detail
  page at `/trades/:id`.
- **Trade analytics** — MAE/MFE + exit optimizer (`journal.analytics.ts`),
  rule-adherence tagging.
- **Preferences** — ATR multipliers, capital, risk (single source of truth for
  target/SL maths).
- **Dashboard / Analytics / Funds / Mutual funds** — read the same collections.

### Planned / discussed
- **Ranking system** — score & rank the daily signal set so real trades go to
  the strongest setups. Fed by the Scanner's labeled dataset.
