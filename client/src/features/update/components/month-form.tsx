import { useState, type FormEvent } from "react";
import { Check, CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/common/amount-input";
import { cn } from "@/lib/utils";
import { amountText, fmtINR, longMonth, monthLabel, parseAmount } from "@/lib/format";
import { useSaveMonth } from "@/features/accounts/hooks/use-accounts";
import { ASSET_TYPES, LIABILITY_TYPES, TYPE_META } from "@/features/accounts/utils/account-meta";
import type { MonthEntry } from "@/features/accounts/api/accounts-api";
import type { Account, Snapshot, SnapshotRow } from "@/features/accounts/types/accounts.types";

interface Props {
  month: string;
  accounts: Account[];
  rows: SnapshotRow[];
}

interface Draft {
  value: string;
  invested: string;
}

interface Line {
  account: Account;
  saved: Snapshot | null; // this month's saved value
  before: Snapshot | null; // most recent value before this month
}


export function MonthForm({ month, accounts, rows }: Props) {
  const save = useSaveMonth();

  // Accounts to show: open ones, plus closed ones that already have this month.
  const lines: Line[] = accounts
    .map((account) => {
      const mine = rows.filter((r) => r.accountId === account.id);
      const saved = mine.find((r) => r.month === month) ?? null;
      const before = mine.filter((r) => r.month < month).sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
      return { account, saved, before };
    })
    .filter((l) => !l.account.closed || l.saved);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draftOf = (l: Line): Draft =>
    drafts[l.account.id] ?? { value: amountText(l.saved?.value), invested: amountText(l.saved?.invested) };
  const setDraft = (id: string, patch: Partial<Draft>, l: Line) =>
    setDrafts((d) => ({ ...d, [id]: { ...draftOf(l), ...d[id], ...patch } }));

  const isChanged = (l: Line) => {
    const d = draftOf(l);
    const v = parseAmount(d.value);
    if (v === null) return false;
    if (!l.saved) return true;
    const inv = parseAmount(d.invested);
    return v !== l.saved.value || (TYPE_META[l.account.type].tracksInvested && inv !== (l.saved.invested ?? null));
  };
  const isInvalid = (l: Line) => {
    const d = draftOf(l);
    return (d.value.trim() !== "" && parseAmount(d.value) === null) ||
      (d.invested.trim() !== "" && parseAmount(d.invested) === null);
  };

  const changed = lines.filter(isChanged);
  const invalid = lines.filter(isInvalid);
  const done = lines.filter((l) => l.saved || parseAmount(draftOf(l).value) !== null).length;
  const blanks = lines.filter((l) => !l.saved && draftOf(l).value.trim() === "" && l.before);

  const fillBlanks = () =>
    setDrafts((d) => {
      const next = { ...d };
      for (const l of blanks) {
        next[l.account.id] = { value: amountText(l.before!.value), invested: amountText(l.before!.invested) };
      }
      return next;
    });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (invalid.length || changed.length === 0) return;
    const entries: MonthEntry[] = changed.map((l) => {
      const d = draftOf(l);
      const inv = parseAmount(d.invested);
      const tracks = TYPE_META[l.account.type].tracksInvested;
      return {
        accountId: l.account.id,
        value: parseAmount(d.value)!,
        invested: !tracks ? undefined : inv !== null ? inv : l.saved?.invested != null ? null : undefined,
      };
    });
    save.mutate({ month, entries });
  };

  const section = (title: string, types: typeof ASSET_TYPES) => {
    const list = lines
      .filter((l) => types.includes(l.account.type))
      .sort((a, b) => types.indexOf(a.account.type) - types.indexOf(b.account.type));
    if (list.length === 0) return null;
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {list.map((l) => (
            <Row
              key={l.account.id}
              line={l}
              draft={draftOf(l)}
              invalid={isInvalid(l)}
              onChange={(patch) => setDraft(l.account.id, patch, l)}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 pb-20">
      <div className="flex flex-col gap-3 rounded-2xl bg-primary/12 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-semibold">
              {done} of {lines.length}
            </span>{" "}
            entered for {longMonth(month)}
          </p>
          {blanks.length > 0 && (
            <Button type="button" variant="outline" className="h-9 gap-1.5 rounded-xl" onClick={fillBlanks}>
              <CopyCheck className="size-4" /> Copy last values
            </Button>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${lines.length ? (done / lines.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {section("What you own", ASSET_TYPES)}
      {section("What you owe", LIABILITY_TYPES)}

      {/* save bar: sits above the phone tab bar, at the bottom on desktop */}
      <div className="fixed inset-x-0 bottom-(--nav-h) z-10 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-60">
        <div className="mx-auto flex max-w-md items-center gap-3 md:max-w-3xl md:px-4">
          <p className="flex-1 text-sm text-muted-foreground">
            {invalid.length
              ? "Fix the highlighted amounts."
              : changed.length
                ? `${changed.length} to save`
                : "All saved"}
          </p>
          <Button
            type="submit"
            className="h-11 rounded-xl px-6 text-[15px]"
            disabled={save.isPending || changed.length === 0 || invalid.length > 0}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Row({
  line,
  draft,
  invalid,
  onChange,
}: {
  line: Line;
  draft: Draft;
  invalid: boolean;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const { account, saved, before } = line;
  const meta = TYPE_META[account.type];
  const id = `m-${account.id}`;

  return (
    <div className={cn("flex flex-col gap-2.5 px-4 py-3.5", invalid && "bg-destructive/5")}>
      <div className="flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
        <label htmlFor={id} className="min-w-0 flex-1 truncate font-medium">
          {account.name}
        </label>
        {saved && <Check className="size-4 shrink-0 text-up" aria-label="Saved" />}
      </div>
      <div className={cn("grid gap-2", meta.tracksInvested && "grid-cols-2")}>
        <div className="flex flex-col gap-1">
          <AmountInput id={id} value={draft.value} onChange={(value) => onChange({ value })} />
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {meta.tracksInvested ? "Value" : meta.valueLabel}
            {before && ` · ${monthLabel(before.month)} ${fmtINR(before.value)}`}
          </span>
        </div>
        {meta.tracksInvested && (
          <div className="flex flex-col gap-1">
            <AmountInput id={`${id}-inv`} value={draft.invested} onChange={(invested) => onChange({ invested })} />
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Invested{before?.invested != null && ` · ${fmtINR(before.invested)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
