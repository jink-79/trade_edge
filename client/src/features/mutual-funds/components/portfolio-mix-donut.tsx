import { PieChart as PieIcon } from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type MutualFundsSummary,
  type DonutDataPoint,
} from "../types/mutual-funds.types";
import { CATEGORIES, CAT_TOKENS } from "../utils/mutual-funds-utils";
import { DonutTooltip } from "./donut-tooltip";

interface PortfolioMixDonutProps {
  summary: MutualFundsSummary;
}

export function PortfolioMixDonut({ summary }: PortfolioMixDonutProps) {
  const donutData: DonutDataPoint[] = CATEGORIES.map((cat) => ({
    name: cat,
    value: summary.byCategory[cat] ?? 0,
    color: CAT_TOKENS[cat].chart,
  })).filter((d) => d.value > 0);

  return (
    <Card
      className="col-span-12 xl:col-span-4 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieIcon className="size-4 text-chart-2" /> Portfolio Mix
        </CardTitle>
        <CardDescription>Capital split by fund category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-47.5">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                stroke="none"
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-2">
          {CATEGORIES.map((cat) => {
            const amt = summary.byCategory[cat] ?? 0;
            const pct =
              summary.totalInvested > 0
                ? (amt / summary.totalInvested) * 100
                : 0;
            return (
              <div
                key={cat}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2.5 rounded-sm ${CAT_TOKENS[cat].dot}`}
                  />
                  <span className="text-muted-foreground">{cat}</span>
                </div>
                <span className="tabular">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
