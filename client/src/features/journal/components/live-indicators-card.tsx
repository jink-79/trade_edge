import { Activity, Gauge, Loader2, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLiveIndicators } from "../hooks/use-journal";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const CLOSE_POSITION_LABEL: Record<string, string> = {
  "at-high": "At session high",
  "upper-third": "Upper third of range",
  mid: "Mid-range",
  "lower-third": "Lower third of range",
  "at-low": "At session low",
};

function Tile({
  label,
  value,
  caption,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive",
          tone === "warn" && "text-[oklch(0.82_0.16_85)]",
        )}
      >
        {value}
      </div>
      {caption ? <div className="text-[11px] text-muted-foreground mt-0.5">{caption}</div> : null}
    </div>
  );
}

const signedPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

/** Raw technical-indicator panel (EMAs, RSI, Mansfield RS, MACD, ADX, price
 * action) for this trade's symbol — actual current readings, not a
 * scorecard. Off the latest available OHLCV, same as StockStrengthCard, so
 * it reads the same whether the position is open or long closed. */
export function LiveIndicatorsCard({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useLiveIndicators(id);

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Technical indicators
          </CardTitle>
          <CardDescription>EMAs, RSI, RS, MACD, ADX and price action — latest close.</CardDescription>
        </div>
        {data && (
          <div className="text-right">
            <Badge
              className={cn(
                "border h-5 px-1.5 text-[10px] hover:bg-transparent",
                data.niftyRegime === "up"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-destructive/10 text-destructive border-destructive/30",
              )}
            >
              Nifty {data.niftyRegime === "up" ? "up-trend" : "down-trend"}
            </Badge>
            <div className="mt-1 text-[11px] text-muted-foreground">as of {fmtDate(data.asOfDate)}</div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="size-4 animate-spin" /> Computing…
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            {(error as any)?.response?.data?.message ??
              "Not enough price history yet to compute technical indicators."}
          </p>
        ) : data ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Tile
              label="EMA 20"
              value={data.ema20 != null ? data.ema20.toFixed(2) : "—"}
              caption={data.ema20 != null ? signedPct(((data.close - data.ema20) / data.ema20) * 100) + " vs close" : undefined}
              tone={data.ema20 != null ? (data.close >= data.ema20 ? "good" : "bad") : "default"}
            />
            <Tile
              label="EMA 50"
              value={data.ema50 != null ? data.ema50.toFixed(2) : "—"}
              caption={data.ema50 != null ? signedPct(((data.close - data.ema50) / data.ema50) * 100) + " vs close" : undefined}
              tone={data.ema50 != null ? (data.close >= data.ema50 ? "good" : "bad") : "default"}
            />
            <Tile
              label="EMA 200"
              value={data.ema200 != null ? data.ema200.toFixed(2) : "—"}
              caption={data.ema200 != null ? signedPct(((data.close - data.ema200) / data.ema200) * 100) + " vs close" : undefined}
              tone={data.ema200 != null ? (data.close >= data.ema200 ? "good" : "bad") : "default"}
            />
            <Tile
              label="RSI (14)"
              value={data.rsi14 != null ? data.rsi14.toFixed(1) : "—"}
              caption={
                data.rsi14 != null
                  ? data.rsi14 >= 70
                    ? "overbought"
                    : data.rsi14 <= 30
                      ? "oversold"
                      : "neutral"
                  : undefined
              }
              tone={
                data.rsi14 != null
                  ? data.rsi14 >= 70
                    ? "warn"
                    : data.rsi14 <= 30
                      ? "warn"
                      : "default"
                  : "default"
              }
            />
            <Tile
              label="RS (Mansfield, vs Nifty)"
              value={data.mansfieldRs != null ? signedPct(data.mansfieldRs) : "—"}
              caption="EMA 55 of price-relative"
              tone={data.mansfieldRs != null ? (data.mansfieldRs >= 0 ? "good" : "bad") : "default"}
            />
            <Tile
              label="ADX (14)"
              value={data.adx14 != null ? data.adx14.toFixed(1) : "—"}
              caption={
                data.adx14 != null
                  ? data.adx14 >= 25
                    ? "trending"
                    : "range-bound"
                  : undefined
              }
              tone={data.adx14 != null ? (data.adx14 >= 25 ? "good" : "default") : "default"}
            />
            <Tile
              label="MACD"
              value={data.macd != null ? data.macd.line.toFixed(2) : "—"}
              caption={
                data.macd != null
                  ? `signal ${data.macd.signal.toFixed(2)}, ${data.macd.histogram >= 0 ? "bullish" : "bearish"} cross`
                  : undefined
              }
              tone={data.macd != null ? (data.macd.histogram >= 0 ? "good" : "bad") : "default"}
            />
            <Tile
              label="Price action"
              value={CLOSE_POSITION_LABEL[data.priceAction.closePosition]}
              caption={`${data.priceAction.streakDays > 0 ? `${data.priceAction.streakDays}d ${data.priceAction.streakDirection} streak` : "no streak"}`}
            />
            <Tile
              label="Off 20-session range"
              value={
                <span className="text-base">
                  {signedPct(data.priceAction.pctFrom20High)}
                  <span className="text-muted-foreground text-xs"> / </span>
                  {signedPct(data.priceAction.pctFrom20Low)}
                </span>
              }
              caption="from 20-session high / low"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
