import { Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtSignedINR, fmtPrice } from "../utils/journal-utils";
import type { TradeAnalytics } from "../types/journal.types";

const fmtR = (r: number | null) =>
  r != null ? `${r >= 0 ? "+" : ""}${r.toFixed(2)}R` : "—";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

/**
 * Replays alternative exit rules on this trade's own candles and shows which
 * would have made the most — the highest-rupee lever for a mean-reversion book.
 */
export function TradeExitOptimizer({
  analytics,
}: {
  analytics: TradeAnalytics;
}) {
  const actualR = analytics.actualR;
  const bestR = analytics.best.rMultiple;
  const edge =
    actualR != null && bestR != null ? bestR - actualR : null;

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Exit optimizer
          </CardTitle>
          <CardDescription>
            What each exit rule would have returned on this trade.
          </CardDescription>
        </div>
        <Badge className="border h-6 px-2 gap-1.5 bg-primary/10 text-primary border-primary/30 hover:bg-primary/10">
          <Trophy className="size-3" /> Best {fmtR(bestR)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {actualR != null && (
          <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">You exited at </span>
              <span
                className={cn(
                  "font-semibold tabular",
                  actualR >= 0 ? "text-primary" : "text-destructive",
                )}
              >
                {fmtR(actualR)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · best rule was {analytics.best.label}
              </span>
            </div>
            {edge != null && edge > 0.01 && (
              <span className="text-sm tabular text-primary">
                +{edge.toFixed(2)}R left on the table
              </span>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground border-b border-border/60">
                <th className="text-left font-medium py-2 pr-3">Exit rule</th>
                <th className="text-right font-medium py-2 px-3">Exit</th>
                <th className="text-right font-medium py-2 px-3">Held</th>
                <th className="text-right font-medium py-2 px-3">R</th>
                <th className="text-right font-medium py-2 pl-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              {analytics.sims.map((s) => {
                const isBest = s.key === analytics.best.key;
                const pos = (s.rMultiple ?? 0) >= 0;
                return (
                  <tr
                    key={s.key}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      isBest && "bg-primary/5",
                    )}
                  >
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-1.5">
                        {isBest && (
                          <Trophy className="size-3 text-primary shrink-0" />
                        )}
                        <span
                          className={cn(
                            s.key === "plan" && "font-medium",
                          )}
                        >
                          {s.label}
                        </span>
                        {s.key === "plan" && (
                          <Badge className="border h-4 px-1 text-[9px] bg-secondary/50 text-muted-foreground border-border/60 hover:bg-secondary/50">
                            actual
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="text-right tabular py-2.5 px-3">
                      {fmtPrice(s.exitPrice)}
                      <span className="text-muted-foreground text-xs">
                        {" "}
                        · {fmtDate(s.exitDate)}
                      </span>
                    </td>
                    <td className="text-right tabular py-2.5 px-3 text-muted-foreground">
                      {s.daysHeld}d
                    </td>
                    <td
                      className={cn(
                        "text-right tabular py-2.5 px-3 font-medium",
                        pos ? "text-primary" : "text-destructive",
                      )}
                    >
                      {fmtR(s.rMultiple)}
                    </td>
                    <td
                      className={cn(
                        "text-right tabular py-2.5 pl-3",
                        pos ? "text-primary" : "text-destructive",
                      )}
                    >
                      {fmtSignedINR(s.pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-muted-foreground border-t border-border/60 pt-3">
          Simulated on this trade's daily candles. One trade proves nothing —
          the signal shows up when the same rule wins across many trades. Don't
          switch strategy off a single row.
        </p>
      </CardContent>
    </Card>
  );
}
