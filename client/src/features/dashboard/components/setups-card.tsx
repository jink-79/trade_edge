import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { fmtINR } from "@/lib/positions-utils";
import type { DashboardSetup } from "../types/dashboard.types";

interface SetupsCardProps {
  setups: DashboardSetup[];
}

export function SetupsCard({ setups }: SetupsCardProps) {
  return (
    <Card
      className="col-span-12 xl:col-span-5 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="size-4 text-chart-5" /> Exit Breakdown
        </CardTitle>
        <CardDescription>Closed trades grouped by exit reason</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {setups.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No closed trades yet.
          </div>
        ) : (
          setups.map((s) => {
            const pos = s.avgPnl >= 0;
            return (
              <div key={s.setup} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{s.setup}</div>
                    <div className="text-xs text-muted-foreground tabular">
                      {s.trades} trade{s.trades > 1 ? "s" : ""} · avg{" "}
                      <span
                        className={pos ? "text-primary" : "text-destructive"}
                      >
                        {pos ? "+" : ""}
                        {fmtINR(s.avgPnl)}
                      </span>
                    </div>
                  </div>
                  <span className="tabular text-sm">
                    {s.winRate.toFixed(0)}%
                  </span>
                </div>
                <Progress value={s.winRate} className="h-1.5 bg-secondary/80" />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
