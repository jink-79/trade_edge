import { ShieldCheck, ShieldOff, TrendingDown, TrendingUp } from "lucide-react";

interface NiftyFilterBannerProps {
  niftyAboveEma: boolean;
  niftyClose: number;
  niftyEma20w: number;
}

export function NiftyFilterBanner({
  niftyAboveEma,
  niftyClose,
  niftyEma20w,
}: NiftyFilterBannerProps) {
  const gap = (((niftyClose - niftyEma20w) / niftyEma20w) * 100).toFixed(2);
  const isPos = niftyAboveEma;

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl px-5 py-3.5 border text-sm ${
        isPos
          ? "bg-primary/8 border-primary/25"
          : "bg-destructive/8 border-destructive/25"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`size-8 rounded-lg grid place-items-center ring-1 shrink-0 ${
            isPos
              ? "bg-primary/15 ring-primary/30"
              : "bg-destructive/15 ring-destructive/30"
          }`}
        >
          {isPos ? (
            <ShieldCheck className="size-4 text-primary" />
          ) : (
            <ShieldOff className="size-4 text-destructive" />
          )}
        </div>
        <div>
          <p
            className={`font-semibold ${isPos ? "text-primary" : "text-destructive"}`}
          >
            Nifty 20-Week EMA Filter —{" "}
            {isPos ? "ACTIVE: Long bias confirmed" : "OFF: Nifty below 20W EMA"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPos
              ? "All signals this week are valid. Market is in a bullish structure."
              : "Caution: signals are generated but the macro filter is not met. Trade smaller or skip."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0 text-right">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Nifty Close
          </p>
          <p className="tabular font-semibold">
            {niftyClose.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            20W EMA
          </p>
          <p className="tabular font-semibold">
            {niftyEma20w.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Gap
          </p>
          <p
            className={`tabular font-semibold flex items-center gap-0.5 justify-end ${isPos ? "text-primary" : "text-destructive"}`}
          >
            {isPos ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {isPos ? "+" : ""}
            {gap}%
          </p>
        </div>
      </div>
    </div>
  );
}
