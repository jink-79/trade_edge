import { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
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
import { Loader2 } from "lucide-react";
import { fmtINR } from "@/lib/positions-utils";
import { useExitPosition } from "../hooks/use-positions";
import type { EnrichedPosition } from "../types/positions.types";

const EXIT_REASONS = ["Target hit", "Trail hit", "Stop hit", "Discretionary"];

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

interface ExitDialogProps {
  position: EnrichedPosition | null;
  onClose: () => void;
}

export function ExitDialog({ position, onClose }: ExitDialogProps) {
  const [exitPrice, setExitPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [reason, setReason] = useState<string>("Target hit");
  const [notes, setNotes] = useState("");
  const exitMut = useExitPosition();

  // Reset the form whenever a new position is opened
  useEffect(() => {
    if (position) {
      setExitPrice(String(position.currentPrice ?? position.entryPrice));
      setCommission("");
      setReason("Target hit");
      setNotes("");
    }
  }, [position?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!position;
  const isLong = position?.side === "long";
  const exitN = parseFloat(exitPrice) || 0;
  const commN = parseFloat(commission) || 0;

  const gross = position
    ? (exitN - position.entryPrice) * position.quantity * (isLong ? 1 : -1)
    : 0;
  const net = gross - commN;
  const netPct = position
    ? (net / (position.entryPrice * position.quantity)) * 100
    : 0;
  const positive = net >= 0;

  const handleConfirm = () => {
    if (!position) return;
    if (!exitN) {
      toast.error("Enter an exit price");
      return;
    }
    exitMut.mutate(
      {
        id: position._id,
        payload: {
          exitPrice: exitN,
          charges: commN,
          exitReason: reason,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${position.stockSymbol} closed`, {
            description: `${position.quantity} @ ${fmtINR(exitN)} · Net ${
              positive ? "+" : "−"
            }${fmtINR(Math.abs(net))}`,
          });
          onClose();
        },
        onError: (err: any) =>
          toast.error(
            err?.response?.data?.message ?? "Could not close the position.",
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl p-0 gap-0 overflow-hidden">
        {position && (
          <>
            {/* header */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg grid place-items-center bg-destructive/15 ring-1 ring-destructive/30">
                  <LogOut className="size-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                    Exit {position.stockSymbol}
                    <Badge
                      className={cn(
                        "border h-5 px-1.5 text-[10px]",
                        isLong
                          ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/10"
                          : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10",
                      )}
                    >
                      {isLong ? "LONG" : "SHORT"}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs">
                    {position.stockName} · {position.sector} · held{" "}
                    {position.holdingDays}d
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

            {/* snapshot grid */}
            <div className="px-6 py-4 grid grid-cols-4 gap-3 border-b border-border/60 bg-background/40">
              <Snap label="Qty" value={String(position.quantity)} />
              <Snap label="Entry" value={fmtINR(position.entryPrice)} />
              <Snap
                label="LTP"
                value={
                  position.currentPrice != null
                    ? fmtINR(position.currentPrice)
                    : "—"
                }
              />
              <Snap
                label="Trail"
                value={
                  position.trailingStopPrice != null
                    ? fmtINR(position.trailingStopPrice)
                    : "—"
                }
              />
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
                    onChange={(e) => setExitPrice(e.target.value)}
                    className="pl-7 tabular"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  Pre-filled with the last traded price.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Commission &amp; charges
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className="pl-7 tabular"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  Brokerage + taxes for this exit.
                </p>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Exit reason
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {EXIT_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={cn(
                        "h-9 rounded-md text-xs font-medium border transition-colors",
                        reason === r
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/40",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Notes{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <Textarea
                  rows={2}
                  placeholder="What changed? Anything to remember for next time."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* P&L preview */}
            <div className="mx-6 mb-5 rounded-xl border border-border/60 bg-gradient-to-b from-background/60 to-background/20 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Realised P&amp;L preview
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
                  label="Gross"
                  value={`${gross >= 0 ? "+" : "−"}${fmtINR(Math.abs(gross))}`}
                  tone={gross >= 0 ? "good" : "bad"}
                />
                <PnlStat
                  label="Charges"
                  value={`− ${fmtINR(commN)}`}
                  tone="muted"
                />
                <PnlStat
                  label="Net"
                  value={`${positive ? "+" : "−"}${fmtINR(Math.abs(net))}`}
                  tone={positive ? "good" : "bad"}
                  big
                />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Net return on capital:{" "}
                <span
                  className={cn(
                    "tabular",
                    positive ? "text-primary" : "text-destructive",
                  )}
                >
                  {positive ? "+" : ""}
                  {netPct.toFixed(2)}%
                </span>
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
                {exitMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                {exitMut.isPending ? "Closing…" : "Confirm exit"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
