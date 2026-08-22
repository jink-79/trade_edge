import { Activity, Gauge, LineChart, Loader2, TrendingUp, Volume2, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStockStrength } from "../hooks/use-journal";

const COMPONENT_META = [
  { key: "trendAlignment", label: "Trend alignment", icon: TrendingUp },
  { key: "emaDistance", label: "EMA distance", icon: LineChart },
  { key: "relativeStrength", label: "Relative strength", icon: Gauge },
  { key: "volatility", label: "Volatility regime", icon: Waves },
  { key: "momentum", label: "Momentum", icon: Activity },
  { key: "volume", label: "Volume confirmation", icon: Volume2 },
] as const;

const LABEL_STYLE: Record<string, string> = {
  Strong: "bg-primary/10 text-primary border-primary/30",
  Neutral: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Weak: "bg-destructive/10 text-destructive border-destructive/30",
};

function barTone(score: number): string {
  if (score >= 70) return "bg-primary";
  if (score >= 40) return "bg-amber-400";
  return "bg-destructive";
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function StockStrengthCard({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useStockStrength(id);

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Gauge className="size-4 text-primary" /> Stock strength
          </CardTitle>
          <CardDescription>
            Technical scorecard, not AI — six rule-based checks off the latest OHLCV.
          </CardDescription>
        </div>
        {data && (
          <div className="text-right">
            <Badge className={cn("border h-7 px-3 text-xs", LABEL_STYLE[data.label])}>
              {data.label} · {data.score}/100
            </Badge>
            <div className="mt-1 text-[11px] text-muted-foreground">
              as of {fmtDate(data.asOfDate)}
            </div>
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
              "Not enough price history yet to compute a strength score."}
          </p>
        ) : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Nifty regime:</span>
              <Badge
                className={cn(
                  "border h-5 px-1.5 text-[10px] hover:bg-transparent",
                  data.niftyRegime === "up"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-destructive/10 text-destructive border-destructive/30",
                )}
              >
                {data.niftyRegime === "up" ? "Up-trend" : "Down-trend"}
              </Badge>
            </div>

            {COMPONENT_META.map(({ key, label, icon: Icon }) => {
              const c = data.components[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <Icon className="size-3.5 text-muted-foreground" />
                      {label}
                    </span>
                    <span className="text-xs tabular text-muted-foreground">{c.score}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", barTone(c.score))}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{c.detail}</div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
