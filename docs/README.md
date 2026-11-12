# Bolero — Docs

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
  Mobile-first: single centered column (`max-w-md`), no sidebar.
- **API** — Express 5 + Mongoose + Zod 4 + JWT. Module layout:
  `modules/<name>/<name>.{model,service,controller,routes,types}.ts`.
  Envelope `{ success, message, data }`; `sendSuccess` / `AppError` / `validate`.

## Index

### Architecture docs
- [Net Worth Tracker](architecture/net-worth-tracker.md) — **In progress** —
  monthly snapshots of mutual funds, stocks and bank balances.
