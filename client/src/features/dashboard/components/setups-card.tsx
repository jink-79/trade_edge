import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

const topSetups = [
  { name: "Opening Range Break", trades: 42, winRate: 71, expectancy: 1.42 },
  { name: "VWAP Reclaim", trades: 38, winRate: 63, expectancy: 0.98 },
  { name: "Earnings Reaction", trades: 19, winRate: 58, expectancy: 1.21 },
  { name: "Trend Pullback", trades: 27, winRate: 55, expectancy: 0.74 },
];

export function SetupsCard() {
  return (
    <Card
      className="col-span-12 xl:col-span-5 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="size-4 text-chart-5" /> Top Setups
        </CardTitle>
        <CardDescription>Ranked by expectancy per trade</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topSetups.map((s) => (
          <div key={s.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground tabular">
                  {s.trades} trades · expectancy {s.expectancy}R
                </div>
              </div>
              <span className="tabular text-sm">{s.winRate}%</span>
            </div>
            <Progress value={s.winRate} className="h-1.5 bg-secondary/80" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
