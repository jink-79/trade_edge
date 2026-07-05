import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type MutualFundsSummary } from "../types/mutual-funds.types";
import { CATEGORIES, CAT_TOKENS, fmtINR } from "../utils/mutual-funds-utils";

interface AllocationBarsProps {
  summary: MutualFundsSummary;
}

export function AllocationBars({ summary }: AllocationBarsProps) {
  return (
    <Card
      className="col-span-2 sm:col-span-4 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.14em]">
          Allocation by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {CATEGORIES.map((cat) => {
          const amt = summary.byCategory[cat] ?? 0;
          const pct =
            summary.totalInvested > 0 ? (amt / summary.totalInvested) * 100 : 0;
          return (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-sm ${CAT_TOKENS[cat].dot}`}
                  />
                  <span className="text-muted-foreground">{cat}</span>
                </div>
                <div className="flex items-center gap-3 tabular">
                  <span className="text-xs text-muted-foreground">
                    {fmtINR(amt)}
                  </span>
                  <span className="text-xs font-medium w-10 text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: CAT_TOKENS[cat].chart,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
