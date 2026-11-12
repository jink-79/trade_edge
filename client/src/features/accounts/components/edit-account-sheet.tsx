import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/common/sheet";
import { Field } from "@/components/common/field";
import { fieldClass, selectClass } from "@/components/common/field-styles";
import { useUpdateAccount } from "../hooks/use-accounts";
import { MF_CATEGORIES, type AccountDetail, type MfCategory } from "../types/accounts.types";

interface Props {
  account: AccountDetail;
  open: boolean;
  onClose: () => void;
}

export function EditAccountSheet({ account, open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Edit account">
      <EditForm account={account} onDone={onClose} />
    </Sheet>
  );
}

function EditForm({ account, onDone }: { account: AccountDetail; onDone: () => void }) {
  const [name, setName] = useState(account.name);
  const [institution, setInstitution] = useState(account.institution ?? "");
  const [mfCategory, setMfCategory] = useState<MfCategory | "">(account.mfCategory ?? "");
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateAccount(account.id);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the account a name.");
    update.mutate(
      {
        name: name.trim(),
        institution: institution.trim() || null,
        ...(account.type === "mf" ? { mfCategory: mfCategory || null } : {}),
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="edit-name" label="Name">
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} maxLength={80} />
      </Field>
      <Field id="edit-inst" label={account.type === "mf" ? "Platform" : "Bank or broker"}>
        <Input
          id="edit-inst"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className={fieldClass}
          maxLength={60}
        />
      </Field>
      {account.type === "mf" && (
        <Field id="edit-cat" label="Category">
          <select
            id="edit-cat"
            value={mfCategory}
            onChange={(e) => setMfCategory(e.target.value as MfCategory | "")}
            className={selectClass}
          >
            <option value="">None</option>
            {MF_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="h-12 rounded-xl text-base" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
