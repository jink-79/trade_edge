import { useState } from "react";
import { PlusCircle, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type MutualFundEntry,
  type FundCategory,
} from "../types/mutual-funds.types";
import { CATEGORIES, CAT_TOKENS } from "../utils/mutual-funds-utils";
import { createMutualFundEntry } from "../api/mutual-funds-api";

interface AddEntryFormProps {
  onAdd: (entry: MutualFundEntry) => void;
  onClose: () => void;
}

interface FormState {
  fundName: string;
  date: string;
  amount: string;
  nav: string;
  category: FundCategory | "";
}

interface FormErrors {
  fundName?: string;
  date?: string;
  amount?: string;
  nav?: string;
  category?: string;
}

export function AddEntryForm({ onAdd, onClose }: AddEntryFormProps) {
  const [form, setForm] = useState<FormState>({
    fundName: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    nav: "",
    category: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const units =
    form.amount && form.nav
      ? (parseFloat(form.amount) / parseFloat(form.nav)).toFixed(3)
      : "—";

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.fundName.trim()) errs.fundName = "Required";
    if (!form.date) errs.date = "Required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = "Enter a valid amount";
    if (!form.nav || isNaN(Number(form.nav)) || Number(form.nav) <= 0)
      errs.nav = "Enter a valid NAV";
    if (!form.category) errs.category = "Select a category";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!form.category) return;

    setSaving(true);
    try {
      const created = await createMutualFundEntry({
        fundName: form.fundName.trim(),
        date: new Date(form.date).toISOString(),
        amount: parseFloat(form.amount),
        nav: parseFloat(form.nav),
        units: parseFloat(units),
        category: form.category,
      });
      onAdd(created);
      toast.success("Entry added to your portfolio.");
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Could not save entry. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className="border-primary/30 bg-card/70 ring-1 ring-primary/20"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PlusCircle className="size-4 text-primary" /> New Investment Entry
          </CardTitle>
          <button
            onClick={onClose}
            className="size-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <CardDescription>
          Record a fresh SIP instalment or lump sum purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Fund Name
            </label>
            <Input
              placeholder="e.g. Parag Parikh Flexi Cap Fund Direct Growth"
              value={form.fundName}
              onChange={(e) => setField("fundName", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.fundName ? "border-destructive" : ""}`}
            />
            {errors.fundName && (
              <p className="text-[11px] text-destructive">{errors.fundName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Investment Date
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.date ? "border-destructive" : ""}`}
            />
            {errors.date && (
              <p className="text-[11px] text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Amount (₹)
            </label>
            <Input
              type="number"
              placeholder="1000"
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.amount ? "border-destructive" : ""}`}
            />
            {errors.amount && (
              <p className="text-[11px] text-destructive">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              NAV (₹)
            </label>
            <Input
              type="number"
              placeholder="84.32"
              value={form.nav}
              onChange={(e) => setField("nav", e.target.value)}
              className={`h-9 bg-secondary/40 border-border/60 text-sm ${errors.nav ? "border-destructive" : ""}`}
            />
            {errors.nav && (
              <p className="text-[11px] text-destructive">{errors.nav}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Category
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setField("category", cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    form.category === cat
                      ? `${CAT_TOKENS[cat].color} border-current`
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-[11px] text-destructive">{errors.category}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Units (auto)
            </label>
            <div className="h-9 px-3 flex items-center rounded-md bg-secondary/20 border border-border/40 text-sm tabular text-muted-foreground">
              {units}
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {saving ? "Saving…" : "Save Entry"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
