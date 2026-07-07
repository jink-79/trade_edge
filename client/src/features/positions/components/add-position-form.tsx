import { useState } from "react";
import { PlusCircle, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  CreatePositionPayload,
  PositionSide,
  Timeframe,
} from "../types/positions.types";

const SIDES: PositionSide[] = ["long", "short"];
const TIMEFRAMES: Timeframe[] = ["daily", "weekly", "monthly"];

interface AddPositionFormProps {
  onAdd: (payload: CreatePositionPayload) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface FormState {
  stockName: string;
  stockSymbol: string;
  sector: string;
  tradeDate: string;
  side: PositionSide;
  entryPrice: string;
  quantity: string;
  timeframe: Timeframe;
  notes: string;
}

interface FormErrors {
  stockName?: string;
  stockSymbol?: string;
  sector?: string;
  tradeDate?: string;
  entryPrice?: string;
  quantity?: string;
}

export function AddPositionForm({
  onAdd,
  onClose,
  isLoading = false,
}: AddPositionFormProps) {
  const [form, setForm] = useState<FormState>({
    stockName: "",
    stockSymbol: "",
    sector: "",
    tradeDate: new Date().toISOString().slice(0, 10),
    side: "long",
    entryPrice: "",
    quantity: "",
    timeframe: "weekly",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const invested =
    form.entryPrice && form.quantity
      ? parseFloat(form.entryPrice) * parseFloat(form.quantity)
      : 0;

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.stockName.trim()) e.stockName = "Required";
    if (!form.stockSymbol.trim()) e.stockSymbol = "Required";
    if (!form.sector.trim()) e.sector = "Required";
    if (!form.tradeDate) e.tradeDate = "Required";
    if (!form.entryPrice || +form.entryPrice <= 0)
      e.entryPrice = "Enter a valid price";
    if (!form.quantity || +form.quantity <= 0 || !Number.isInteger(+form.quantity))
      e.quantity = "Whole number > 0";
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onAdd({
      stockName: form.stockName.trim(),
      stockSymbol: form.stockSymbol.trim().toUpperCase(),
      sector: form.sector.trim(),
      tradeDate: new Date(form.tradeDate).toISOString(),
      side: form.side,
      entryPrice: parseFloat(form.entryPrice),
      quantity: parseInt(form.quantity, 10),
      timeframe: form.timeframe,
      notes: form.notes.trim() || undefined,
    });
  };

  const fieldCls = (err?: string) =>
    `h-9 bg-secondary/40 border-border/60 text-sm ${err ? "border-destructive" : ""}`;

  return (
    <Card
      className="border-primary/30 bg-card/70 ring-1 ring-primary/20"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PlusCircle className="size-4 text-primary" /> New Position
          </CardTitle>
          <button
            onClick={onClose}
            className="size-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <CardDescription>Log an open position you're holding</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Stock name */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Stock Name
            </label>
            <Input
              placeholder="e.g. Tata Motors Ltd"
              value={form.stockName}
              onChange={(e) => set("stockName", e.target.value)}
              className={fieldCls(errors.stockName)}
            />
            {errors.stockName && (
              <p className="text-[11px] text-destructive">{errors.stockName}</p>
            )}
          </div>

          {/* Symbol */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Symbol
            </label>
            <Input
              placeholder="TATAMOTORS"
              value={form.stockSymbol}
              onChange={(e) => set("stockSymbol", e.target.value)}
              className={fieldCls(errors.stockSymbol)}
            />
            {errors.stockSymbol && (
              <p className="text-[11px] text-destructive">
                {errors.stockSymbol}
              </p>
            )}
          </div>

          {/* Sector */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Sector
            </label>
            <Input
              placeholder="e.g. Auto"
              value={form.sector}
              onChange={(e) => set("sector", e.target.value)}
              className={fieldCls(errors.sector)}
            />
            {errors.sector && (
              <p className="text-[11px] text-destructive">{errors.sector}</p>
            )}
          </div>

          {/* Trade date */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Trade Date
            </label>
            <Input
              type="date"
              value={form.tradeDate}
              onChange={(e) => set("tradeDate", e.target.value)}
              className={fieldCls(errors.tradeDate)}
            />
            {errors.tradeDate && (
              <p className="text-[11px] text-destructive">{errors.tradeDate}</p>
            )}
          </div>

          {/* Entry price */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Entry Price (₹)
            </label>
            <Input
              type="number"
              placeholder="900"
              value={form.entryPrice}
              onChange={(e) => set("entryPrice", e.target.value)}
              className={fieldCls(errors.entryPrice)}
            />
            {errors.entryPrice && (
              <p className="text-[11px] text-destructive">
                {errors.entryPrice}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Quantity
            </label>
            <Input
              type="number"
              placeholder="10"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className={fieldCls(errors.quantity)}
            />
            {errors.quantity && (
              <p className="text-[11px] text-destructive">{errors.quantity}</p>
            )}
          </div>

          {/* Side */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Side
            </label>
            <div className="flex gap-1.5">
              {SIDES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("side", s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border capitalize transition-all ${
                    form.side === s
                      ? s === "long"
                        ? "text-primary border-primary/50 bg-primary/10"
                        : "text-destructive border-destructive/50 bg-destructive/10"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Timeframe
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("timeframe", t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border capitalize transition-all ${
                    form.timeframe === t
                      ? "text-primary border-primary/50 bg-primary/10"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Invested (auto) */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Invested (auto)
            </label>
            <div className="h-9 px-3 flex items-center rounded-md bg-secondary/20 border border-border/40 text-sm tabular text-muted-foreground">
              {invested > 0 ? `₹${invested.toLocaleString("en-IN")}` : "—"}
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Notes{" "}
              <span className="normal-case tracking-normal text-muted-foreground/50">
                (optional)
              </span>
            </label>
            <Input
              placeholder="e.g. Breakout above 900, thesis…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="h-9 bg-secondary/40 border-border/60 text-sm"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isLoading ? "Saving…" : "Save Position"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
