import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fmtINR, monthLabel } from "@/lib/format";
import { usePossessions } from "../hooks/use-possessions";
import { PossessionSheet } from "../components/possession-sheet";
import { CATEGORY_META } from "../utils/possession-meta";
import { ageLabel, totals, valueNow } from "../utils/possession-value";
import type { Possession } from "../types/possessions.types";

export function PossessionsPage() {
  const { data: items, isLoading, isError, refetch } = usePossessions();
  // undefined = closed, null = adding, item = editing
  const [sheet, setSheet] = useState<Possession | null | undefined>(undefined);

  // Most recently bought first; same month → most recently added first.
  const sorted = [...(items ?? [])].sort(
    (a, b) => b.purchaseMonth.localeCompare(a.purchaseMonth) || b.createdAt.localeCompare(a.createdAt),
  );
  const { paid, worth } = totals(items ?? []);
  const lost = paid - worth;

  return (
    <>
      <div className="flex items-start justify-between gap-4 pb-5 pt-2 md:pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Possessions</h1>
          <p className="text-sm text-muted-foreground">Things you own, valued as they age.</p>
        </div>
        <Button onClick={() => setSheet(null)} className="h-10 gap-1.5 rounded-xl px-4">
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {isLoading && (
        <div className="grid place-items-center py-16">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Couldn't load your possessions.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {items && items.length === 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border p-6">
          <div>
            <p className="font-medium">Add your first item</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your bike, fridge, laptop, bed. Enter what you paid and when, and Bolero estimates what each is worth
              today. They're shown next to your net worth, not mixed into it.
            </p>
          </div>
          <Button onClick={() => setSheet(null)} className="h-11 gap-2 self-start rounded-xl px-5">
            <Plus className="size-4" /> Add item
          </Button>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Worth now · {items.length} items</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{fmtINR(worth)}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
              <div>
                <p className="text-muted-foreground">You paid</p>
                <p className="mt-0.5 font-medium tabular-nums">{fmtINR(paid)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lost to age</p>
                <p className="mt-0.5 font-medium tabular-nums text-down">
                  {lost > 0 ? `−${fmtINR(lost)}` : fmtINR(0)}
                </p>
              </div>
            </div>
          </section>

          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {sorted.map((p) => {
              const { icon: Icon } = CATEGORY_META[p.category];
              const now = valueNow(p);
              const dropPct = p.purchasePrice > 0 ? ((p.purchasePrice - now) / p.purchasePrice) * 100 : 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSheet(p)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/60 active:bg-secondary"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cat-possessions/15 text-cat-possessions">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground tabular-nums">
                      {fmtINR(p.purchasePrice)} · {monthLabel(p.purchaseMonth)} · {ageLabel(p.purchaseMonth)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-medium tabular-nums">{fmtINR(now)}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {dropPct >= 0.5 ? `−${Math.round(dropPct)}%` : "Holds value"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">Tap an item to edit or remove it.</p>
        </div>
      )}

      <PossessionSheet open={sheet !== undefined} onClose={() => setSheet(undefined)} item={sheet ?? null} />
    </>
  );
}
