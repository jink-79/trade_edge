import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Wand2, X } from "lucide-react";
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
import { fmtINR, fmtPrice, isTrendRs55 } from "../utils/journal-utils";
import { useReviewJournalTrade } from "../hooks/use-journal";
import type { JournalTrade } from "../types/journal.types";

function Captured({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium tabular mt-0.5">{value}</div>
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

interface ReviewTradeDialogProps {
  trade: JournalTrade | null;
  onClose: () => void;
}

export function ReviewTradeDialog({ trade, onClose }: ReviewTradeDialogProps) {
  const reviewMut = useReviewJournalTrade();

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [targetUnderResistance, setTUR] = useState(false);
  const [stopHasSupport, setSHS] = useState(false);
  const [sector, setSector] = useState("");

  const e = trade?.entry;
  const trendRs55 = trade ? isTrendRs55(trade) : false;

  useEffect(() => {
    if (e) {
      setScreenshot(null);
      setAiAnalysis("");
      setTUR(!!e.targetUnderResistance);
      setSHS(!!e.stopHasSupport);
      setSector(e.sector ?? "");
    }
  }, [trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    reviewMut.mutate(
      {
        id: trade.id,
        payload: {
          screenshot: screenshot ?? undefined,
          aiAnalysis: aiAnalysis.trim() || undefined,
          targetUnderResistance,
          stopHasSupport,
          sector: sector.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${trade.entry.ticker} reviewed`);
          onClose();
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Could not save review."),
      },
    );
  };

  return (
    <Dialog open={!!trade} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {trade && e && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
                  <Wand2 className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                    Review {e.ticker}
                    <Badge className="border h-5 px-1.5 text-[10px] bg-[oklch(0.82_0.16_85/0.12)] text-[oklch(0.82_0.16_85)] border-[oklch(0.82_0.16_85/0.3)]">
                      Auto-captured
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs">
                    Trade #{trade.tradeNumber} · everything below was computed —
                    just add your screenshot &amp; Claude's comment.
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="size-8 -mr-2 text-muted-foreground">
                    <X className="size-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            {/* auto-captured values (read-only) */}
            <div className="px-6 py-4 border-b border-border/60 bg-background/40">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                Captured from Kite + candles
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <Captured label="Entry" value={fmtINR(e.entryPrice)} />
                <Captured label="Qty" value={String(e.quantity)} />
                <Captured label="RSI(2)" value={e.rsi2.toFixed(2)} />
                <Captured label="ATR(14)" value={e.atr14.toFixed(2)} />
                <Captured label="Pullback" value={`${e.pullbackDepth.toFixed(2)}%`} />
                <Captured label="vs 200 EMA" value={`${e.distanceFrom200Ema.toFixed(2)}%`} />
                {trendRs55 ? (
                  <Captured
                    label="RS-55"
                    value={e.rs55Pct != null ? `${e.rs55Pct.toFixed(2)}%` : "—"}
                  />
                ) : (
                  <Captured label="Target/Stop" value={`${fmtPrice(e.targetPrice)} / ${fmtPrice(e.stopPrice)}`} />
                )}
                <Captured label="Candle close" value={e.entryCandleClose} />
              </div>
            </div>

            {/* review inputs */}
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary" /> Entry screenshot
                  </Label>
                  {screenshot ? (
                    <div className="relative inline-block">
                      <img src={screenshot} alt="Entry" className="max-h-44 rounded-lg border border-border/60" />
                      <button
                        type="button"
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 size-6 grid place-items-center rounded-md bg-background/80 border border-border/60 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 h-32 rounded-lg border border-dashed border-border/70 bg-secondary/20 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <ImagePlus className="size-5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Upload chart screenshot</span>
                      <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                    </label>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Claude's analysis at entry</Label>
                  <Textarea
                    rows={6}
                    value={aiAnalysis}
                    onChange={(ev) => setAiAnalysis(ev.target.value)}
                    placeholder="Paste Claude's read of the setup…"
                  />
                </div>
              </div>

              {/* the fields that can't be computed */}
              <div className={cn("grid grid-cols-1 gap-4", trendRs55 ? "sm:grid-cols-1" : "sm:grid-cols-3")}>
                {!trendRs55 && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Target under resistance?</Label>
                      <YesNo value={targetUnderResistance} onChange={setTUR} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Stop has support?</Label>
                      <YesNo value={stopHasSupport} onChange={setSHS} />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sector</Label>
                  <Input value={sector} onChange={(ev) => setSector(ev.target.value)} placeholder="e.g. Industrials" />
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/60 bg-background/40 sm:justify-between">
              <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
                Later
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={reviewMut.isPending}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {reviewMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {reviewMut.isPending ? "Saving…" : "Confirm & save"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
