import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/common/sheet";
import { Field } from "@/components/common/field";
import { fieldClass } from "@/components/common/field-styles";
import { AmountInput } from "@/components/common/amount-input";
import { cn } from "@/lib/utils";
import { currentMonth, fmtINR, parseAmount } from "@/lib/format";
import { useDeletePossession, useSavePossession } from "../hooks/use-possessions";
import { CATEGORIES, CATEGORY_META } from "../utils/possession-meta";
import { valueNow } from "../utils/possession-value";
import type { Possession, PossessionCategory } from "../types/possessions.types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Item to edit, or null to add a new one. */
  item: Possession | null;
}

export function PossessionSheet({ open, onClose, item }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={item ? "Edit item" : "Add item"}>
      <PossessionForm item={item} onDone={onClose} />
    </Sheet>
  );
}

function PossessionForm({ item, onDone }: { item: Possession | null; onDone: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<PossessionCategory>(item?.category ?? "vehicle");
  const [price, setPrice] = useState(item ? String(item.purchasePrice) : "");
  const [month, setMonth] = useState(item?.purchaseMonth ?? currentMonth());
  const [drop, setDrop] = useState(String(item?.yearlyDropPct ?? CATEGORY_META.vehicle.defaultDrop));
  const [dropTouched, setDropTouched] = useState(Boolean(item));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useSavePossession();
  const remove = useDeletePossession();

  const pickCategory = (c: PossessionCategory) => {
    setCategory(c);
    // Follow the category's usual rate until the user sets their own.
    if (!dropTouched) setDrop(String(CATEGORY_META[c].defaultDrop));
  };

  const priceNum = parseAmount(price);
  const dropNum = Number(drop);
  const dropValid = drop.trim() !== "" && Number.isFinite(dropNum) && dropNum >= 0 && dropNum <= 90;
  const preview =
    priceNum && dropValid ? valueNow({ purchasePrice: priceNum, purchaseMonth: month, yearlyDropPct: dropNum }) : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give it a name.");
    if (!priceNum) return setError("Enter what you paid.");
    if (!dropValid) return setError("Yearly drop must be between 0 and 90%.");
    setError(null);
    save.mutate(
      {
        id: item?.id,
        name: name.trim(),
        category,
        purchasePrice: priceNum,
        purchaseMonth: month,
        yearlyDropPct: dropNum,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">What is it?</span>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Category">
          {CATEGORIES.map((c) => {
            const { icon: Icon, label } = CATEGORY_META[c];
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pickCategory(c)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                <span className="text-center leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Field id="pos-name" label="Name">
        <Input
          id="pos-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={CATEGORY_META[category].example}
          className={fieldClass}
          maxLength={80}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="pos-price" label="You paid">
          <AmountInput id="pos-price" value={price} onChange={setPrice} />
        </Field>
        <Field id="pos-month" label="Bought in">
          <Input
            id="pos-month"
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className={fieldClass}
          />
        </Field>
      </div>

      <Field
        id="pos-drop"
        label="Loses value each year"
        hint={category === "jewellery" ? "Gold usually holds its value, so 0% is a fair default." : undefined}
      >
        <div className="relative">
          <Input
            id="pos-drop"
            inputMode="decimal"
            value={drop}
            onChange={(e) => {
              setDropTouched(true);
              setDrop(e.target.value.replace(/[^\d.]/g, ""));
            }}
            className={cn(fieldClass, "pr-8 tabular-nums")}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
        </div>
      </Field>

      {preview !== null && (
        <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm">
          Worth about <span className="font-semibold tabular-nums">{fmtINR(preview)}</span> today
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-12 rounded-xl text-base" disabled={save.isPending}>
        {save.isPending ? "Saving…" : item ? "Save" : "Add item"}
      </Button>

      {item && (
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="h-11 rounded-xl"
          disabled={remove.isPending}
          onClick={() => (confirmDelete ? remove.mutate(item.id, { onSuccess: onDone }) : setConfirmDelete(true))}
        >
          {confirmDelete ? "Tap again to remove" : "Remove (sold, given away or gone)"}
        </Button>
      )}
    </form>
  );
}
