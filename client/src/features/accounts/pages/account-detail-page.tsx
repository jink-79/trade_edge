import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { currentMonth, fmtINR, monthLabel } from "@/lib/format";
import { useAccount, useDeleteAccount, useUpdateAccount } from "../hooks/use-accounts";
import { TYPE_META } from "../utils/account-meta";
import { fmtPct, gainOf } from "../utils/gain";
import { Sparkline } from "../components/sparkline";
import { SnapshotSheet } from "../components/snapshot-sheet";
import { EditAccountSheet } from "../components/edit-account-sheet";
import type { AccountDetail, Snapshot } from "../types/accounts.types";

export function AccountDetailPage() {
  const { id = "" } = useParams();
  const { data: account, isLoading, isError } = useAccount(id);

  return (
    <>
      <Link
        to="/accounts"
        className="-ml-1 mb-3 mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:mt-0"
      >
        <ChevronLeft className="size-4" /> Accounts
      </Link>

      {isLoading && (
        <div className="grid place-items-center py-16">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      )}
      {isError && <p className="py-12 text-center text-sm text-muted-foreground">This account couldn't be found.</p>}
      {account && <Detail account={account} />}
    </>
  );
}

function Detail({ account }: { account: AccountDetail }) {
  const meta = TYPE_META[account.type];
  const navigate = useNavigate();
  const [entry, setEntry] = useState<{ editing: Snapshot | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdateAccount(account.id);
  const remove = useDeleteAccount(account.id);

  const { latest, snapshots } = account;
  const gain = gainOf(latest);
  const sub = [meta.label, account.institution, account.mfCategory].filter(Boolean).join(" · ");
  const hasThisMonth = snapshots.some((s) => s.month === currentMonth());
  const chrono = [...snapshots].reverse().map((s) => s.value);

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-start gap-3">
        <span className={cn("mt-2 size-3 shrink-0 rounded-full", meta.dot)} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{account.name}</h1>
          <p className="text-sm text-muted-foreground">
            {sub}
            {account.closed && <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs">Closed</span>}
          </p>
        </div>
        <Button variant="ghost" size="icon-lg" aria-label="Edit account" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
        </Button>
      </div>

      {/* value card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          {meta.valueLabel} · {latest ? monthLabel(latest.month) : "no value yet"}
        </p>
        <p className={cn("text-4xl font-semibold tracking-tight tabular-nums", meta.liability && "text-down")}>
          {latest ? (meta.liability ? "−" : "") + fmtINR(latest.value) : "—"}
        </p>
        {gain && latest?.invested != null && (
          <p className="text-sm text-muted-foreground tabular-nums">
            Invested {fmtINR(latest.invested)} ·{" "}
            <span className={gain.amount >= 0 ? "text-up" : "text-down"}>
              {gain.amount >= 0 ? "+" : "−"}
              {fmtINR(Math.abs(gain.amount))} ({fmtPct(gain.pct)})
            </span>
          </p>
        )}
        <Sparkline values={chrono} className="mt-1 h-16 w-full" />
      </div>

      {!account.closed && (
        <Button className="h-12 gap-2 rounded-xl text-base" onClick={() => setEntry({ editing: null })}>
          <Plus className="size-4" />
          {hasThisMonth ? "Enter another month" : `Enter ${monthLabel(currentMonth())}`}
        </Button>
      )}

      {/* history */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {snapshots.map((s, i) => {
            const prev = snapshots[i + 1];
            const diff = prev ? s.value - prev.value : null;
            // For money owed, a rise is bad news.
            const good = diff !== null && (meta.liability ? diff <= 0 : diff >= 0);
            return (
              <button
                key={s.month}
                type="button"
                onClick={() => setEntry({ editing: s })}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/60 active:bg-secondary"
              >
                <span className="flex-1 text-sm">{monthLabel(s.month)}</span>
                <span className="text-right">
                  <span className="block font-medium tabular-nums">{fmtINR(s.value)}</span>
                  {diff !== null && diff !== 0 && (
                    <span className={cn("block text-xs tabular-nums", good ? "text-up" : "text-down")}>
                      {diff > 0 ? "+" : "−"}
                      {fmtINR(Math.abs(diff))}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Tap a month to change or remove it.</p>
      </section>

      {/* manage */}
      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          disabled={update.isPending}
          onClick={() => update.mutate({ closed: !account.closed })}
        >
          {account.closed ? "Reopen account" : "Close account"}
        </Button>
        <p className="-mt-1 text-xs text-muted-foreground">
          {account.closed
            ? "Reopening brings it back into your totals and monthly update."
            : "For a fund you sold or a loan you paid off. Its history stays; it drops out of your totals."}
        </p>
        <Button
          variant="destructive"
          className="h-11 rounded-xl"
          disabled={remove.isPending}
          onClick={() =>
            confirmDelete
              ? remove.mutate(undefined, { onSuccess: () => navigate("/accounts", { replace: true }) })
              : setConfirmDelete(true)
          }
        >
          {confirmDelete ? "Tap again to delete everything" : "Delete account"}
        </Button>
        {confirmDelete && (
          <p className="-mt-1 text-xs text-destructive">
            This removes the account and all {snapshots.length} months of history. Use Close instead to keep them.
          </p>
        )}
      </section>

      <SnapshotSheet
        account={account}
        editing={entry?.editing ?? null}
        open={entry !== null}
        onClose={() => setEntry(null)}
      />
      <EditAccountSheet account={account} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
