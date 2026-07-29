import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtINR } from "../utils/journal-utils";
import type { TradeAnalytics } from "../types/journal.types";

/**
 * MAE / MFE excursion visual — how far the trade ran for you (favourable) vs
 * against you (adverse) while it was open, plus how much of the best move you
 * actually banked.
 */
export function TradeExcursionCard({
  analytics,
}: {
  analytics: TradeAnalytics;
}) {
  const scale = Math.max(analytics.mfeR ?? 0, analytics.maeR ?? 0, 1);
  const mfePct = ((analytics.mfeR ?? 0) / scale) * 100;
  const maePct = ((analytics.maeR ?? 0) / scale) * 100;
  const capture = analytics.mfeCaptureRatio;

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Excursion (MAE / MFE)
        </CardTitle>
        <CardDescription>
          How far it ran in your favour vs against you, in R.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* MFE bar */}
        <Bar
          icon={<TrendingUp className="size-3.5 text-primary" />}
          label="Max favourable (MFE)"
          value={`+${fmtINR(analytics.mfe)} · +${analytics.mfePct.toFixed(2)}%`}
          rText={analytics.mfeR != null ? `+${analytics.mfeR.toFixed(2)}R` : "—"}
          pct={mfePct}
          tone="good"
        />
        {/* MAE bar */}
        <Bar
          icon={<TrendingDown className="size-3.5 text-destructive" />}
          label="Max adverse (MAE)"
          value={`−${fmtINR(analytics.mae)} · −${analytics.maePct.toFixed(2)}%`}
          rText={analytics.maeR != null ? `−${analytics.maeR.toFixed(2)}R` : "—"}
          pct={maePct}
          tone="bad"
        />

        <div className="grid grid-cols-3 gap-3 pt-1">
          <Stat
            label="MFE capture"
            value={capture != null ? `${capture.toFixed(0)}%` : "—"}
            sub="of the max move"
            tone={
              capture == null
                ? "muted"
                : capture >= 60
                  ? "good"
                  : capture >= 30
                    ? "muted"
                    : "bad"
            }
          />
          <Stat
            label="Days to peak"
            value={`${analytics.daysToMfe}d`}
            sub="MFE reached"
          />
          <Stat
            label="Risk / share"
            value={fmtINR(analytics.risk)}
            sub="entry → stop"
          />
        </div>

        {capture != null && capture < 40 && (
          <p className="text-[11px] text-muted-foreground border-t border-border/60 pt-3">
            You banked only {capture.toFixed(0)}% of the peak move — the trade
            gave back most of its gains before you exited. Worth checking the
            exit optimizer below.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Bar({
  icon,
  label,
  value,
  rText,
  pct,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  rText: string;
  pct: number;
  tone: "good" | "bad";
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          {icon} {label}
        </span>
        <span
          className={cn(
            "text-sm font-semibold tabular",
            tone === "good" ? "text-primary" : "text-destructive",
          )}
        >
          {rText}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(2, pct))}%`,
            background:
              tone === "good"
                ? "var(--gradient-success, var(--primary))"
                : "var(--gradient-danger, var(--destructive))",
          }}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground tabular">
        {value}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "good" | "bad" | "muted" | "default";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-base font-semibold tabular",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
