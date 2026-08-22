import { useEffect, useState } from "react";
import { CalendarIcon, Loader2, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { estimateCharges, fmtPrice, isTrendRs55 } from "../utils/journal-utils";
import { useExitJournalTrade, useExitSummary } from "../hooks/use-journal";
import type { JournalTrade, Outcome } from "../types/journal.types";

const REASONS: { label: string; outcome: Exclude<Outcome, "STILL-OPEN"> }[] = [
  { label: "Target hit", outcome: "TARGET" },
  { label: "Stop hit", outcome: "STOP" },
  { label: "Manual exit", outcome: "MANUAL-EXIT" },
];

// trend-flip-only strategies have no target/stop concept — just the signal
// flipping, or a manual override.
const TREND_REASONS: { label: string; outcome: Exclude<Outcome, "STILL-OPEN"> }[] = [
  { label: "Trend flip", outcome: "TREND-FLIP" },
  { label: "Manual exit", outcome: "MANUAL-EXIT" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

/** yyyy-mm-dd (local, not UTC) <-> Date, so the calendar picks the day the
 * user actually clicks rather than shifting a day at UTC boundaries. */
const isoToLocalDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
const dateToISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const fmtExitDate = (iso: string) =>
  isoToLocalDate(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const QTY_PRESETS = [
  { label: "25%", fraction: 0.25 },
  { label: "50%", fraction: 0.5 },
  { label: "75%", fraction: 0.75 },
  { label: "All", fraction: 1 },
];

export function ExitPositionDialog({
  trade,
  onClose,
}: {
  trade: JournalTrade | null;
  onClose: () => void;
}) {
  const exitMut = useExitJournalTrade();
  const summaryMut = useExitSummary();
  const trendRs55 = trade ? isTrendRs55(trade) : false;
  const reasons = trendRs55 ? TREND_REASONS : REASONS;
  const [exitPrice, setExitPrice] = useState("");
  const [exitDate, setExitDate] = useState(todayISO());
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<string>(reasons[0].label);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Reset the form each time a different trade is opened.
  useEffect(() => {
    if (trade) {
      const trend = isTrendRs55(trade);
      setExitPrice(
        String(trade.entry.targetPrice ?? trade.markPrice ?? trade.entry.entryPrice),
      );
      setExitDate(todayISO());
      setQuantity(String(trade.entry.quantity));
      setReason((trend ? TREND_REASONS : REASONS)[0].label);
      setAiSummary(null);
    }
  }, [trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!trade;
  const e = trade?.entry;
  const long = e?.direction === "LONG";
  const exitN = parseFloat(exitPrice) || 0;
  const fullQty = e?.quantity ?? 0;
  const qtyN = Math.min(Math.max(parseFloat(quantity) || 0, 0), fullQty);
  const isPartial = qtyN > 0 && qtyN < fullQty;
  const invalidQty = qtyN <= 0 || qtyN > fullQty;

  const gross = e ? (exitN - e.entryPrice) * qtyN * (long ? 1 : -1) : 0;
  const invested = e && qtyN > 0 ? e.entryPrice * qtyN : 0;
  const charges = e ? estimateCharges(e.entryPrice * qtyN, exitN * qtyN) : null;
  const net = charges ? gross - charges.totalCharges : gross;
  const netPct = invested > 0 ? (net / invested) * 100 : 0;
  const riskPerShare =
    e?.stopPrice == null
      ? null
      : long
        ? e.entryPrice - e.stopPrice
        : e.stopPrice - e.entryPrice;
  const rMultiple =
    e && riskPerShare != null && riskPerShare > 0
      ? ((long ? exitN - e.entryPrice : e.entryPrice - exitN) / riskPerShare)
      : null;
  const positive = net >= 0;

  const selected = reasons.find((r) => r.label === reason) ?? reasons[0];

  const handleGenerateSummary = () => {
    if (!trade || !e) return;
    if (!exitN || invalidQty) {
      toast.error("Enter a valid exit price and quantity first");
      return;
    }
    summaryMut.mutate(
      {
        id: trade.id,
        payload: {
          outcome: selected.outcome,
          exitPrice: exitN,
          exitDate: new Date(exitDate).toISOString(),
          quantity: qtyN,
        },
      },
      {
        onSuccess: (data) => setAiSummary(data.summary),
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Could not generate a summary right now",
          ),
      },
    );
  };

  const handleConfirm = () => {
    if (!trade || !e) return;
    if (!exitN) {
      toast.error("Enter an exit price");
      return;
    }
    if (invalidQty) {
      toast.error(`Enter a quantity between 1 and ${fullQty}`);
      return;
    }
    if (selected.outcome === "MANUAL-EXIT" && !aiSummary) {
      toast.error("Generate an AI summary first — it's used as the exit reason");
      return;
    }
    exitMut.mutate(
      {
        id: trade.id,
        payload: {
          outcome: selected.outcome,
          exitPrice: exitN,
          exitDate: new Date(exitDate).toISOString(),
          quantity: qtyN,
          ...(selected.outcome === "MANUAL-EXIT"
            ? { manualExitReason: aiSummary! }
            : {}),
          ...(aiSummary ? { aiAnalysis: aiSummary } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(`${e.ticker} ${isPartial ? "partially exited" : "closed"}`, {
            description: `${qtyN} @ ${fmtPrice(exitN)} · ${
              positive ? "+" : "−"
            }${fmtPrice(Math.abs(net))} net`,
          });
          onClose();
        },
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Could not record exit",
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl border-border/60 bg-card/95 backdrop-blur-xl p-0 gap-0 overflow-hidden">
        {trade && e && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg grid place-items-center bg-destructive/15 ring-1 ring-destructive/30">
                  <LogOut className="size-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                    Exit {e.ticker}
                    <Badge
                      className={cn(
                        "border h-5 px-1.5 text-[10px]",
                        long
                          ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/10"
                          : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10",
                      )}
                    >
                      {e.direction}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs">
                    {e.sector || "—"} · entered {fmtDate(e.entryDate)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* form */}
            <div className="px-6 py-6 grid grid-cols-2 gap-x-4 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Exit price <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.05"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={exitPrice}
                    onChange={(ev) => setExitPrice(ev.target.value)}
                    className="pl-7 tabular"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Exit date <span className="text-primary">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal tabular text-foreground"
                    >
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      {fmtExitDate(exitDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={isoToLocalDate(exitDate)}
                      onSelect={(d) => d && setExitDate(dateToISO(d))}
                      disabled={{ after: new Date() }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Quantity to exit <span className="text-primary">*</span>{" "}
                  <span className="text-muted-foreground/60">(of {fullQty} held)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="1"
                    min={1}
                    max={fullQty}
                    inputMode="numeric"
                    value={quantity}
                    onChange={(ev) => setQuantity(ev.target.value)}
                    className="tabular w-28"
                  />
                  <div className="flex gap-1.5">
                    {QTY_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setQuantity(String(Math.max(1, Math.round(fullQty * p.fraction))))
                        }
                        className="h-8 px-2.5 rounded-md text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {isPartial && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {fullQty - qtyN} will stay open
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Exit reason</Label>
                <div className={cn("grid gap-2", trendRs55 ? "grid-cols-2" : "grid-cols-3")}>
                  {reasons.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setReason(r.label)}
                      className={cn(
                        "h-9 rounded-md text-xs font-medium border transition-colors",
                        reason === r.label
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/40",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Exit summary{" "}
                    {selected.outcome === "MANUAL-EXIT" ? (
                      <span className="text-primary">*</span>
                    ) : (
                      <span className="text-muted-foreground/60">(optional)</span>
                    )}
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    disabled={summaryMut.isPending}
                    onClick={handleGenerateSummary}
                  >
                    {summaryMut.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    {aiSummary ? "Regenerate" : "Generate"}
                  </Button>
                </div>
                <div className="min-h-[64px] rounded-md border border-border/60 bg-background/40 p-3 text-sm leading-relaxed">
                  {summaryMut.isPending ? (
                    <span className="text-muted-foreground">Writing summary…</span>
                  ) : aiSummary ? (
                    <span className="whitespace-pre-line">{aiSummary}</span>
                  ) : (
                    <span className="text-muted-foreground/60">
                      Generated automatically from this trade's numbers — click Generate.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* P&L preview */}
            <div className="mx-6 mb-5 rounded-xl border border-border/60 bg-gradient-to-b from-background/60 to-background/20 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {isPartial ? "Realised P&L preview (partial)" : "Realised P&L preview"}
                </div>
                <Badge
                  className={cn(
                    "border h-5 px-1.5 text-[10px] hover:bg-transparent",
                    positive
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-destructive/10 text-destructive border-destructive/30",
                  )}
                >
                  {positive ? "Profit" : "Loss"}
                </Badge>
              </div>

              {/* Gross → Charges → Net waterfall */}
              <div className="mt-4 flex items-center gap-2.5">
                <PnlBox
                  label="Gross P&L"
                  value={`${gross >= 0 ? "+" : "−"}${fmtPrice(Math.abs(gross))}`}
                  tone={gross >= 0 ? "good" : "bad"}
                />
                <span className="text-muted-foreground text-lg shrink-0">−</span>
                <PnlBox
                  label="Charges (est.)"
                  value={charges ? fmtPrice(charges.totalCharges) : "—"}
                  tone="muted"
                />
                <span className="text-muted-foreground text-lg shrink-0">=</span>
                <PnlBox
                  label="Net P&L"
                  value={`${positive ? "+" : "−"}${fmtPrice(Math.abs(net))}`}
                  tone={positive ? "good" : "bad"}
                  emphasize
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <PnlBox
                  label="Net return"
                  value={`${netPct >= 0 ? "+" : ""}${netPct.toFixed(2)}%`}
                  tone={positive ? "good" : "bad"}
                  compact
                />
                <PnlBox
                  label="R multiple"
                  value={rMultiple != null ? `${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R` : "—"}
                  tone={rMultiple == null ? "muted" : rMultiple >= 0 ? "good" : "bad"}
                  compact
                />
              </div>

              {charges && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
                    Estimated charges breakdown
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <ChargeChip label="STT" value={charges.stt} />
                    <ChargeChip label="Exchange" value={charges.exchangeCharges} />
                    <ChargeChip label="SEBI" value={charges.sebiCharges} />
                    <ChargeChip label="Stamp duty" value={charges.stampDuty} />
                    <ChargeChip label="DP" value={charges.dpCharges} />
                    <ChargeChip label="GST" value={charges.gst} />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-border/60 bg-background/40 sm:justify-between">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={exitMut.isPending}
                className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <LogOut className="size-4" />{" "}
                {exitMut.isPending
                  ? "Closing…"
                  : isPartial
                    ? `Exit ${qtyN} of ${fullQty}`
                    : "Confirm exit"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function PnlBox({
  label,
  value,
  tone,
  emphasize,
  compact,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "muted";
  emphasize?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-lg border p-3",
        emphasize
          ? tone === "good"
            ? "border-primary/40 bg-primary/10"
            : "border-destructive/40 bg-destructive/10"
          : "border-border/60 bg-card/40",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 tabular font-semibold truncate",
          emphasize ? "text-xl" : compact ? "text-base" : "text-sm",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ChargeChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground truncate">
        {label}
      </div>
      <div className="mt-0.5 text-xs tabular font-medium">{fmtPrice(value)}</div>
    </div>
  );
}
