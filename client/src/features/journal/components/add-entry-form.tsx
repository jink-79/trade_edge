import { useState } from "react";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ManualEntryPayload } from "../api/journal-api";

interface FormState {
  symbol: string;
  entryPrice: string;
  quantity: string;
  entryDate: string;
}

interface FormErrors {
  symbol?: string;
  entryPrice?: string;
  quantity?: string;
}

interface AddEntryFormProps {
  onAdd: (payload: ManualEntryPayload) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function AddEntryForm({ onAdd, onClose, isLoading = false }: AddEntryFormProps) {
  const [form, setForm] = useState<FormState>({
    symbol: "",
    entryPrice: "",
    quantity: "",
    entryDate: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.symbol.trim()) e.symbol = "Required";
    if (!form.entryPrice || isNaN(+form.entryPrice) || +form.entryPrice <= 0)
      e.entryPrice = "Enter a valid price";
    if (!form.quantity || isNaN(+form.quantity) || +form.quantity <= 0)
      e.quantity = "Enter a valid quantity";
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onAdd({
      symbol: form.symbol.trim().toUpperCase(),
      entryPrice: parseFloat(form.entryPrice),
      quantity: parseFloat(form.quantity),
      entryDate: form.entryDate ? new Date(form.entryDate).toISOString() : undefined,
    });
  };

  return (
    <Card
      className="border-primary/30 bg-card/70 ring-1 ring-primary/20"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Add Entry</CardTitle>
            <CardDescription className="mt-0.5">
              Record a Trend + RS-55 position you actually took — technical context
              (ATR/EMA/RS) is fetched automatically, no target/stop since this strategy
              exits on trend flip only.
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Symbol
            </label>
            <Input
              placeholder="e.g. RELIANCE"
              value={form.symbol}
              onChange={(e) => set("symbol", e.target.value.toUpperCase())}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.symbol ? "border-destructive" : ""}`}
            />
            {errors.symbol && <p className="text-[11px] text-destructive">{errors.symbol}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Entry Price (₹)
            </label>
            <Input
              type="number"
              step="0.05"
              placeholder="1250.50"
              value={form.entryPrice}
              onChange={(e) => set("entryPrice", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.entryPrice ? "border-destructive" : ""}`}
            />
            {errors.entryPrice && (
              <p className="text-[11px] text-destructive">{errors.entryPrice}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Quantity
            </label>
            <Input
              type="number"
              placeholder="50"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.quantity ? "border-destructive" : ""}`}
            />
            {errors.quantity && (
              <p className="text-[11px] text-destructive">{errors.quantity}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Entry Date
            </label>
            <Input
              type="date"
              value={form.entryDate}
              onChange={(e) => set("entryDate", e.target.value)}
              className="h-9 bg-secondary/40 border-border/60 text-sm"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="size-4" />
              {isLoading ? "Adding…" : "Add Entry"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
