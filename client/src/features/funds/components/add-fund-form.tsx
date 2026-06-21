import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AddFundPayload, FundType } from "../types/funds.types";

const FUND_TYPES: { value: FundType; label: string; desc: string }[] = [
  { value: "trading", label: "Trading", desc: "Broker capital" },
  { value: "savings", label: "Savings", desc: "Long-term buffer" },
  { value: "emergency", label: "Emergency", desc: "Safety net" },
  { value: "other", label: "Other", desc: "Misc funds" },
];

const TYPE_ACTIVE: Record<FundType, string> = {
  trading:
    "text-primary bg-primary/10 border-primary/40 ring-1 ring-primary/25",
  savings:
    "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.1)] border-[oklch(0.68_0.18_240/0.4)] ring-1 ring-[oklch(0.68_0.18_240/0.25)]",
  emergency:
    "text-[oklch(0.82_0.16_85)] bg-[oklch(0.82_0.16_85/0.1)] border-[oklch(0.82_0.16_85/0.4)] ring-1 ring-[oklch(0.82_0.16_85/0.25)]",
  other:
    "text-muted-foreground bg-accent/40 border-border ring-1 ring-border/60",
};

interface FormState {
  name: string;
  type: FundType | "";
  date: string;
  amount: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  date?: string;
  amount?: string;
}

interface AddFundFormProps {
  onAdd: (payload: AddFundPayload) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function AddFundForm({
  onAdd,
  onClose,
  isLoading = false,
}: AddFundFormProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    type: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.type) e.type = "Select a type";
    if (!form.date) e.date = "Required";
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0)
      e.amount = "Enter a valid amount";
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onAdd({
      name: form.name.trim(),
      type: form.type as FundType,
      date: new Date(form.date).toISOString(),
      amount: parseFloat(form.amount),
      notes: form.notes.trim() || undefined,
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
            <CardTitle className="text-base font-semibold">
              Add Fund Entry
            </CardTitle>
            <CardDescription className="mt-0.5">
              Record a new capital deposit or allocation
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
          {/* Name */}
          <div className="lg:col-span-1 space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Fund / Account Name
            </label>
            <Input
              placeholder="e.g. Zerodha, HDFC"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Date
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.date ? "border-destructive" : ""}`}
            />
            {errors.date && (
              <p className="text-[11px] text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Amount (₹)
            </label>
            <Input
              type="number"
              placeholder="50000"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.amount ? "border-destructive" : ""}`}
            />
            {errors.amount && (
              <p className="text-[11px] text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Notes{" "}
              <span className="normal-case tracking-normal text-muted-foreground/50">
                (optional)
              </span>
            </label>
            <Input
              placeholder="e.g. Monthly top-up"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="h-9 bg-secondary/40 border-border/60 text-sm"
            />
          </div>

          {/* Type selector — full width */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Fund Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {FUND_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => set("type", t.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    form.type === t.value
                      ? TYPE_ACTIVE[t.value]
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/30"
                  }`}
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="text-[11px] opacity-70">{t.desc}</span>
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="text-[11px] text-destructive">{errors.type}</p>
            )}
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="size-4" />
              {isLoading ? "Saving…" : "Save Entry"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
