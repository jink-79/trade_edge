import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { fmtINR } from "@/lib/format";
import { useAccounts } from "../hooks/use-accounts";
import { AccountRow } from "../components/account-row";
import { AddAccountSheet } from "../components/add-account-sheet";
import { ASSET_TYPES, LIABILITY_TYPES, TYPE_META } from "../utils/account-meta";
import type { Account, AccountType } from "../types/accounts.types";

const total = (list: Account[]) => list.reduce((sum, a) => sum + (a.latest?.value ?? 0), 0);

export function AccountsPage() {
  const { data: accounts, isLoading, isError, refetch } = useAccounts();
  const [adding, setAdding] = useState<AccountType | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const open = (accounts ?? []).filter((a) => !a.closed);
  const closed = (accounts ?? []).filter((a) => a.closed);
  const byType = (t: AccountType) => open.filter((a) => a.type === t);
  const owned = total(open.filter((a) => !TYPE_META[a.type].liability));
  const owed = total(open.filter((a) => TYPE_META[a.type].liability));

  return (
    <>
      <div className="flex items-start justify-between gap-4 pb-5 pt-2 md:pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Accounts</h1>
          <p className="text-sm text-muted-foreground">What you own and what you owe.</p>
        </div>
        <Button onClick={() => setAdding("mf")} className="h-10 gap-1.5 rounded-xl px-4">
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
          <p className="text-sm text-muted-foreground">Couldn't load your accounts.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {accounts && accounts.length === 0 && <EmptyState onAdd={setAdding} />}

      {accounts && accounts.length > 0 && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label="You own" value={fmtINR(owned)} />
            <SummaryTile label="You owe" value={owed ? `−${fmtINR(owed)}` : fmtINR(0)} negative={owed > 0} />
          </div>

          <Section title="What you own" types={ASSET_TYPES} byType={byType} onAdd={setAdding} />
          <Section title="What you owe" types={LIABILITY_TYPES} byType={byType} onAdd={setAdding} />

          {closed.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowClosed((s) => !s)}
                className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={cn("size-4 transition-transform", showClosed && "rotate-180")} />
                Closed accounts ({closed.length})
              </button>
              {showClosed && (
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card opacity-70">
                  {closed.map((a) => (
                    <AccountRow key={a.id} account={a} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AddAccountSheet open={adding !== null} onClose={() => setAdding(null)} initialType={adding ?? undefined} />
    </>
  );
}

function SummaryTile({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums md:text-xl", negative && "text-down")}>{value}</p>
    </div>
  );
}

function Section({
  title,
  types,
  byType,
  onAdd,
}: {
  title: string;
  types: AccountType[];
  byType: (t: AccountType) => Account[];
  onAdd: (t: AccountType) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {types.map((t) => {
        const list = byType(t);
        const meta = TYPE_META[t];
        const sum = total(list);
        return (
          <div key={t} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <span className={cn("size-2.5 rounded-full", meta.dot)} />
              <span className="flex-1 font-medium">
                {meta.group}
                {list.length > 0 && <span className="text-muted-foreground"> · {list.length}</span>}
              </span>
              <span className={cn("font-semibold tabular-nums", meta.liability && sum > 0 && "text-down")}>
                {meta.liability && sum > 0 ? "−" : ""}
                {fmtINR(sum)}
              </span>
            </div>
            {list.length > 0 ? (
              <div className="divide-y divide-border">
                {list.map((a) => (
                  <AccountRow key={a.id} account={a} />
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(t)}
                className="flex w-full items-center gap-2 px-4 py-3.5 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                <Plus className="size-4" /> Add {meta.label.toLowerCase()}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: (t: AccountType) => void }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-dashed border-border p-6">
      <div>
        <p className="font-medium">Add your first account</p>
        <p className="mt-1 text-sm text-muted-foreground">
          One per mutual fund, one per broker account for stocks, and one per bank account, loan and credit card.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[...ASSET_TYPES, ...LIABILITY_TYPES].map((t) => (
          <Button key={t} variant="outline" className="h-10 gap-2 rounded-xl" onClick={() => onAdd(t)}>
            <span className={cn("size-2 rounded-full", TYPE_META[t].dot)} />
            {TYPE_META[t].label}
          </Button>
        ))}
      </div>
    </div>
  );
}
