import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/common/sheet";
import { Field } from "@/components/common/field";
import { fieldClass, selectClass } from "@/components/common/field-styles";
import { cn } from "@/lib/utils";
import { currentMonth, parseAmount } from "@/lib/format";
import { useCreateAccount } from "../hooks/use-accounts";
import { AmountInput } from "@/components/common/amount-input";
import { ALL_TYPES, TYPE_META } from "../utils/account-meta";
import { MF_CATEGORIES, type AccountType, type MfCategory } from "../types/accounts.types";

interface Props {
  open: boolean;
  onClose: () => void;
  initialType?: AccountType;
}

export function AddAccountSheet({ open, onClose, initialType }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Add account">
      <AddAccountForm onDone={onClose} initialType={initialType ?? "mf"} />
    </Sheet>
  );
}

function AddAccountForm({ onDone, initialType }: { onDone: () => void; initialType: AccountType }) {
  const [type, setType] = useState<AccountType>(initialType);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [mfCategory, setMfCategory] = useState<MfCategory | "">("");
  const [month, setMonth] = useState(currentMonth());
  const [value, setValue] = useState("");
  const [invested, setInvested] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateAccount();
  const meta = TYPE_META[type];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = parseAmount(value);
    const inv = parseAmount(invested);
    if (!name.trim()) return setError("Give the account a name.");
    if (v === null) return setError(`Enter the ${meta.valueLabel.toLowerCase()}. Use 0 if it's empty.`);
    if (invested.trim() && inv === null) return setError("The invested amount isn't a valid number.");
    setError(null);
    create.mutate(
      {
        type,
        name: name.trim(),
        institution: institution.trim() || undefined,
        mfCategory: type === "mf" && mfCategory ? mfCategory : undefined,
        month,
        value: v,
        invested: meta.tracksInvested && inv !== null ? inv : undefined,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Type</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Account type">
          {ALL_TYPES.map((t) => {
            const m = TYPE_META[t];
            const active = t === type;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("size-2 rounded-full", m.dot)} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <Field id="acc-name" label="Name">
        <Input
          id="acc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={meta.namePlaceholder}
          className={fieldClass}
          maxLength={80}
        />
      </Field>

      <div className={cn("grid gap-4", type === "mf" && "grid-cols-2")}>
        <Field id="acc-inst" label={type === "mf" ? "Platform" : "Bank or broker"}>
          <Input
            id="acc-inst"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder={meta.institutionPlaceholder}
            className={fieldClass}
            maxLength={60}
          />
        </Field>
        {type === "mf" && (
          <Field id="acc-cat" label="Category">
            <select
              id="acc-cat"
              value={mfCategory}
              onChange={(e) => setMfCategory(e.target.value as MfCategory | "")}
              className={selectClass}
            >
              <option value="">Choose…</option>
              {MF_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-secondary/60 p-4">
        <Field id="acc-month" label="As of">
          <Input
            id="acc-month"
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className={fieldClass}
          />
        </Field>
        <Field id="acc-value" label={meta.valueLabel}>
          <AmountInput id="acc-value" value={value} onChange={setValue} />
        </Field>
        {meta.tracksInvested && (
          <Field id="acc-invested" label="Invested so far (optional)" hint="Lets Bolero show your gain or loss.">
            <AmountInput id="acc-invested" value={invested} onChange={setInvested} />
          </Field>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-12 rounded-xl text-base" disabled={create.isPending}>
        {create.isPending ? "Adding…" : "Add account"}
      </Button>
    </form>
  );
}
