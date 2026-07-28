import { useEffect, useState } from "react";
import { ImagePlus, Loader2, LogOut, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { deriveExitMetrics, fmtINR } from "../utils/journal-utils";
import { useExitJournalTrade } from "../hooks/use-journal";
import type {
  ExitTradePayload,
  JournalTrade,
  Outcome,
} from "../types/journal.types";

type ClosedOutcome = Exclude<Outcome, "STILL-OPEN">;

const OUTCOMES: { value: ClosedOutcome; label: string }[] = [
  { value: "TARGET", label: "Target hit" },
  { value: "STOP", label: "Stop hit" },
  { value: "MANUAL-EXIT", label: "Manual exit" },
];

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium tabular">{value}</div>
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {[
        { v: true, label: "Yes" },
        { v: false, label: "No" },
      ].map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "px-4 py-1.5 rounded-md text-xs font-medium border transition-all",
            value === o.v
              ? "text-primary border-primary/50 bg-primary/10"
              : "border-border/60 text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PnlStat({
  label,
  value,
  tone,
  big = false,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "muted";
  big?: boolean;
}) {
  const toneClass =
    tone === "good"
      ? "text-primary"
      : tone === "bad"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "tabular font-semibold",
          big ? "text-xl" : "text-sm",
          toneClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

interface ExitTradeDialogProps {
  trade: JournalTrade | null;
  onClose: () => void;
}

export function ExitTradeDialog({ trade, onClose }: ExitTradeDialogProps) {
  const exitMut = useExitJournalTrade();

  const [outcome, setOutcome] = useState<ClosedOutcome>("TARGET");
  const [exitPrice, setExitPrice] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [stopWicked, setStopWicked] = useState(false);
  const [targetTagged, setTargetTagged] = useState(false);
  const [mae, setMae] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");

  const e = trade?.entry;

  // Reset when a new trade opens; prefill exit price with the target level
  useEffect(() => {
    if (e) {
      setOutcome("TARGET");
      setExitPrice(String(e.targetPrice));
      setExitDate(new Date().toISOString().slice(0, 16));
      setManualReason("");
      setStopWicked(false);
      setTargetTagged(false);
      setMae("");
      setScreenshot(null);
      setAiAnalysis("");
    }
  }, [trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!trade;
  const exitN = parseFloat(exitPrice) || 0;

  const metrics =
    e && exitN > 0
      ? deriveExitMetrics(
          {
            direction: e.direction,
            entryPrice: e.entryPrice,
            stopPrice: e.stopPrice,
            quantity: e.quantity,
            entryDate: e.entryDate,
          },
          { exitPrice: exitN, exitDate: new Date(exitDate).toISOString() },
        )
      : null;
  const positive = (metrics?.realizedPnl ?? 0) >= 0;

  const pickOutcome = (o: ClosedOutcome) => {
    setOutcome(o);
    if (o === "TARGET" && e) setExitPrice(String(e.targetPrice));
    else if (o === "STOP" && e) setExitPrice(String(e.stopPrice));
  };

  const onFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Select an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!trade) return;
    if (exitN <= 0) return toast.error("Enter a valid exit price");
    if (outcome === "MANUAL-EXIT" && !manualReason.trim())
      return toast.error("Add a manual-exit reason");

    const payload: ExitTradePayload = {
      outcome,
      exitPrice: exitN,
      exitDate: new Date(exitDate).toISOString(),
      manualExitReason: manualReason.trim() || undefined,
      stopWickedThenRecovered: stopWicked,
      targetTaggedThenReversed: targetTagged,
      maxAdverseExcursion: mae.trim() ? parseFloat(mae) : undefined,
      screenshot: screenshot ?? undefined,
      aiAnalysis: aiAnalysis.trim() || undefined,
    };

    exitMut.mutate(
      { id: trade.id, payload },
      {
        onSuccess: () => {
          toast.success(`${trade.entry.ticker} closed`, {
            description: metrics
              ? `Net ${positive ? "+" : "−"}${fmtINR(Math.abs(metrics.realizedPnl))} · ${metrics.rMultiple != null ? `${metrics.rMultiple.toFixed(2)}R` : "—"}`
              : undefined,
          });
          onClose();
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Could not record exit."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
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
                        e.direction === "LONG"
                          ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/10"
                          : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10",
                      )}
                    >
                      {e.direction}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs">
                    Trade #{trade.tradeNumber} · {e.sector || "—"} · locks the
                    entry record
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="size-8 -mr-2 text-muted-foreground">
                    <X className="size-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            {/* snapshot */}
            <div className="px-6 py-4 grid grid-cols-4 gap-3 border-b border-border/60 bg-background/40">
              <Snap label="Qty" value={String(e.quantity)} />
              <Snap label="Entry" value={fmtINR(e.entryPrice)} />
              <Snap label="Target" value={fmtINR(e.targetPrice)} />
              <Snap label="Stop" value={fmtINR(e.stopPrice)} />
            </div>

            {/* form */}
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Outcome</Label>
                <div className="grid grid-cols-3 gap-2">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => pickOutcome(o.value)}
                      className={cn(
                        "h-9 rounded-md text-xs font-medium border transition-colors",
                        outcome === o.value
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/40",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      value={exitPrice}
                      onChange={(ev) => setExitPrice(ev.target.value)}
                      className="pl-7 tabular"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Exit date & time</Label>
                  <Input
                    type="datetime-local"
                    value={exitDate}
                    onChange={(ev) => setExitDate(ev.target.value)}
                  />
                </div>
              </div>

              {outcome === "MANUAL-EXIT" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Manual-exit reason <span className="text-primary">*</span>
                  </Label>
                  <Input
                    value={manualReason}
                    onChange={(ev) => setManualReason(ev.target.value)}
                    placeholder="Why did you close it manually?"
                  />
                </div>
              )}

              {/* intraday excursion flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Stop wicked, then recovered?
                  </Label>
                  <YesNo value={stopWicked} onChange={setStopWicked} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Target tagged, then reversed?
                  </Label>
                  <YesNo value={targetTagged} onChange={setTargetTagged} />
                </div>
              </div>

              <div className="space-y-1.5 max-w-[50%]">
                <Label className="text-xs text-muted-foreground">
                  Max adverse excursion{" "}
                  <span className="text-muted-foreground/60">(optional %)</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={mae}
                    onChange={(ev) => setMae(ev.target.value)}
                    placeholder="e.g. -3.2"
                    className="pr-8 tabular"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* exit chart + Claude's read */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary" /> Exit screenshot
                  </Label>
                  {screenshot ? (
                    <div className="relative inline-block">
                      <img
                        src={screenshot}
                        alt="Exit screenshot"
                        className="max-h-40 rounded-lg border border-border/60"
                      />
                      <button
                        type="button"
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 size-6 grid place-items-center rounded-md bg-background/80 border border-border/60 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 h-28 rounded-lg border border-dashed border-border/70 bg-secondary/20 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <ImagePlus className="size-5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Upload exit chart
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                    </label>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Claude's analysis at exit
                  </Label>
                  <Textarea
                    rows={5}
                    value={aiAnalysis}
                    onChange={(ev) => setAiAnalysis(ev.target.value)}
                    placeholder="Paste Claude's read of the exit…"
                  />
                </div>
              </div>
            </div>

            {/* realised P&L preview */}
            <div className="mx-6 mb-5 rounded-xl border border-border/60 bg-gradient-to-b from-background/60 to-background/20 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Realised outcome preview
                </div>
                <Badge
                  className={cn(
                    "border h-5 px-1.5 text-[10px] hover:bg-transparent",
                    positive
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-destructive/10 text-destructive border-destructive/30",
                  )}
                >
                  {positive ? "Win" : "Loss"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4">
                <PnlStat
                  label="Realised P&L"
                  value={
                    metrics
                      ? `${positive ? "+" : "−"}${fmtINR(Math.abs(metrics.realizedPnl))}`
                      : "—"
                  }
                  tone={positive ? "good" : "bad"}
                  big
                />
                <PnlStat
                  label="Return"
                  value={metrics ? `${metrics.realizedPnlPct >= 0 ? "+" : ""}${metrics.realizedPnlPct.toFixed(2)}%` : "—"}
                  tone={positive ? "good" : "bad"}
                />
                <PnlStat
                  label="R-multiple"
                  value={metrics?.rMultiple != null ? `${metrics.rMultiple.toFixed(2)}R` : "—"}
                  tone={
                    metrics?.rMultiple != null
                      ? metrics.rMultiple >= 0
                        ? "good"
                        : "bad"
                      : "muted"
                  }
                />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Held {metrics?.daysHeld ?? 0} day{metrics?.daysHeld === 1 ? "" : "s"}
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/60 bg-background/40 sm:justify-between">
              <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={exitMut.isPending}
                className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {exitMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                {exitMut.isPending ? "Recording…" : "Confirm exit"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
