import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/common/sheet";
import { Field } from "@/components/common/field";
import { fieldClass } from "@/components/common/field-styles";
import { amountText, currentMonth, fmtINR, monthLabel, parseAmount } from "@/lib/format";
import { useDeleteSnapshot, useUpsertSnapshot } from "../hooks/use-accounts";
import { TYPE_META } from "../utils/account-meta";
import type { AccountDetail, Snapshot } from "../types/accounts.types";
import { AmountInput } from "@/components/common/amount-input";

interface Props {
  account: AccountDetail;
  /** The month being edited, or null to add/update a month of your choice. */
  editing: Snapshot | null;
  open: boolean;
  onClose: () => void;
}

export function SnapshotSheet({ account, editing, open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={editing ? monthLabel(editing.month) : "Enter a month"}>
      <SnapshotForm account={account} editing={editing} onDone={onClose} />
    </Sheet>
  );
}

function SnapshotForm({
  account,
  editing,
  onDone,
}: {
  account: AccountDetail;
  editing: Snapshot | null;
  onDone: () => void;
}) {
  const meta = TYPE_META[account.type];
  const findMonth = (m: string) => account.snapshots.find((s) => s.month === m) ?? null;
  const initial = editing ?? findMonth(currentMonth());

  const [month, setMonth] = useState(editing?.month ?? currentMonth());
  const [value, setValue] = useState(initial ? amountText(initial.value) : "");
  const [invested, setInvested] = useState(initial?.invested != null ? amountText(initial.invested) : "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const upsert = useUpsertSnapshot(account.id);
  const remove = useDeleteSnapshot(account.id);

  const existing = findMonth(month);
  const last = account.latest;

  const onMonthChange = (m: string) => {
    setMonth(m);
    const s = findMonth(m);
    setValue(s ? amountText(s.value) : "");
    setInvested(s?.invested != null ? amountText(s.invested) : "");
  };

  const copyLast = () => {
    if (!last) return;
    setValue(amountText(last.value));
    if (last.invested != null) setInvested(amountText(last.invested));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = parseAmount(value);
    const inv = parseAmount(invested);
    if (v === null) return setError(`Enter the ${meta.valueLabel.toLowerCase()}. Use 0 if it's empty.`);
    if (invested.trim() && inv === null) return setError("The invested amount isn't a valid number.");
    setError(null);
    upsert.mutate(
      { month, value: v, invested: meta.tracksInvested ? inv : null },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {!editing && (
        <Field
          id="snap-month"
          label="Month"
          hint={existing ? "This month already has a value. Saving replaces it." : undefined}
        >
          <Input
            id="snap-month"
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => onMonthChange(e.target.value || currentMonth())}
            className={fieldClass}
          />
        </Field>
      )}

      <Field id="snap-value" label={meta.valueLabel}>
        <AmountInput id="snap-value" value={value} onChange={setValue} autoFocus />
      </Field>

      {meta.tracksInvested && (
        <Field id="snap-invested" label="Invested so far (optional)">
          <AmountInput id="snap-invested" value={invested} onChange={setInvested} />
        </Field>
      )}

      {!editing && last && last.month !== month && (
        <button
          type="button"
          onClick={copyLast}
          className="-mt-2 self-start text-sm text-primary tabular-nums hover:underline"
        >
          Copy {monthLabel(last.month)} ({fmtINR(last.value)})
        </button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-12 rounded-xl text-base" disabled={upsert.isPending}>
        {upsert.isPending ? "Saving…" : "Save"}
      </Button>

      {editing && account.snapshots.length > 1 && (
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="h-11 rounded-xl"
          disabled={remove.isPending}
          onClick={() =>
            confirmDelete ? remove.mutate(editing.month, { onSuccess: onDone }) : setConfirmDelete(true)
          }
        >
          {confirmDelete ? `Tap again to remove ${monthLabel(editing.month)}` : "Remove this month"}
        </Button>
      )}
    </form>
  );
}
