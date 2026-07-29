import { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fmtPrice } from "../utils/journal-utils";
import { useExitJournalTrade } from "../hooks/use-journal";
import type { JournalTrade, Outcome } from "../types/journal.types";

const REASONS: { label: string; outcome: Exclude<Outcome, "STILL-OPEN"> }[] = [
  { label: "Target hit", outcome: "TARGET" },
  { label: "Stop hit", outcome: "STOP" },
  { label: "Manual exit", outcome: "MANUAL-EXIT" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export function ExitPositionDialog({
  trade,
  onClose,
}: {
  trade: JournalTrade | null;
  onClose: () => void;
}) {
  const exitMut = useExitJournalTrade();
  const [exitPrice, setExitPrice] = useState("");
  const [exitDate, setExitDate] = useState(todayISO());
  const [reason, setReason] = useState<string>("Target hit");
  const [notes, setNotes] = useState("");

  // Reset the form each time a different trade is opened.
  useEffect(() => {
    if (trade) {
      setExitPrice(String(trade.entry.targetPrice ?? trade.entry.entryPrice));
      setExitDate(todayISO());
      setReason("Target hit");
      setNotes("");
    }
  }, [trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!trade;
  const e = trade?.entry;
  const long = e?.direction === "LONG";
  const exitN = parseFloat(exitPrice) || 0;

  const gross = e
    ? (exitN - e.entryPrice) * e.quantity * (long ? 1 : -1)
    : 0;
  const grossPct = e ? (gross / (e.entryPrice * e.quantity)) * 100 : 0;
  const riskPerShare = e
    ? long
      ? e.entryPrice - e.stopPrice
      : e.stopPrice - e.entryPrice
    : 0;
  const rMultiple =
    e && riskPerShare > 0
      ? ((long ? exitN - e.entryPrice : e.entryPrice - exitN) / riskPerShare)
      : null;
  const positive = gross >= 0;

  const selected = REASONS.find((r) => r.label === reason) ?? REASONS[0];

  const handleConfirm = () => {
    if (!trade || !e) return;
    if (!exitN) {
      toast.error("Enter an exit price");
      return;
    }
    if (selected.outcome === "MANUAL-EXIT" && !notes.trim()) {
      toast.error("Add a note explaining the manual exit");
      return;
    }
    exitMut.mutate(
      {
        id: trade.id,
        payload: {
          outcome: selected.outcome,
          exitPrice: exitN,
          exitDate: new Date(exitDate).toISOString(),
          ...(selected.outcome === "MANUAL-EXIT"
            ? { manualExitReason: notes.trim() }
            : {}),
          ...(notes.trim() && selected.outcome !== "MANUAL-EXIT"
            ? { aiAnalysis: notes.trim() }
            : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(`${e.ticker} closed`, {
            description: `${e.quantity} @ ${fmtPrice(exitN)} · ${
              positive ? "+" : "−"
            }${fmtPrice(Math.abs(gross))}`,
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
      <DialogContent className="max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl p-0 gap-0 overflow-hidden">
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
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 -mr-2 text-muted-foreground"
                  >
                    <X className="size-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            {/* snapshot */}
            <div className="px-6 py-4 grid grid-cols-4 gap-3 border-b border-border/60 bg-background/40">
              <Snap label="Qty" value={String(e.quantity)} />
              <Snap label="Entry" value={fmtPrice(e.entryPrice)} />
              <Snap label="Target" value={fmtPrice(e.targetPrice)} />
              <Snap label="Stop" value={fmtPrice(e.stopPrice)} />
            </div>

            {/* form */}
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
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
                <Input
                  type="date"
                  value={exitDate}
                  onChange={(ev) => setExitDate(ev.target.value)}
                  className="tabular"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Exit reason</Label>
                <div className="grid grid-cols-3 gap-2">
                  {REASONS.map((r) => (
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
                <Label className="text-xs text-muted-foreground">
                  Notes{" "}
                  {selected.outcome === "MANUAL-EXIT" ? (
                    <span className="text-primary">*</span>
                  ) : (
                    <span className="text-muted-foreground/60">(optional)</span>
                  )}
                </Label>
                <Textarea
                  rows={2}
                  placeholder="What changed? Anything to remember for next time."
                  value={notes}
                  onChange={(ev) => setNotes(ev.target.value)}
                />
              </div>
            </div>

            {/* P&L preview */}
            <div className="mx-6 mb-5 rounded-xl border border-border/60 bg-gradient-to-b from-background/60 to-background/20 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Realised P&L preview
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
              <div className="mt-3 grid grid-cols-3 gap-4">
                <PnlStat
                  label="P&L (₹)"
                  value={`${positive ? "+" : "−"}${fmtPrice(Math.abs(gross))}`}
                  tone={positive ? "good" : "bad"}
                  big
                />
                <PnlStat
                  label="P&L (%)"
                  value={`${grossPct >= 0 ? "+" : ""}${grossPct.toFixed(2)}%`}
                  tone={positive ? "good" : "bad"}
                />
                <PnlStat
                  label="R multiple"
                  value={
                    rMultiple != null
                      ? `${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R`
                      : "—"
                  }
                  tone={
                    rMultiple != null
                      ? rMultiple >= 0
                        ? "good"
                        : "bad"
                      : "muted"
                  }
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/60 bg-background/40 sm:justify-between">
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
                {exitMut.isPending ? "Closing…" : "Confirm exit"}
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

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium tabular">{value}</div>
    </div>
  );
}

function PnlStat({
  label,
  value,
  tone,
  big,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "muted";
  big?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 tabular font-medium",
          big ? "text-xl font-semibold" : "text-sm",
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
