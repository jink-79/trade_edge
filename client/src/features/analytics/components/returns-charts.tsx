import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHART_STYLE, fmtPct } from "./analytics-primitives";
import type { MonthlyReturn, RBucket } from "../types/analytics.types";

interface ReturnsChartsProps {
  monthlyReturns: MonthlyReturn[];
  rDistribution: RBucket[];
  rDistributionMode: "r" | "pct";
}

export function ReturnsCharts({
  monthlyReturns,
  rDistribution,
  rDistributionMode,
}: ReturnsChartsProps) {
  const greenMonths = monthlyReturns.filter((m) => m.r >= 0).length;
  const bestMonth = monthlyReturns.reduce((a, b) => (b.r > a.r ? b : a));

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Monthly returns */}
      <Card className="xl:col-span-2 border-border/70 bg-card/60 backdrop-blur">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle
              className="text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Monthly returns
            </CardTitle>
            <CardDescription>
              {greenMonths} green months, {monthlyReturns.length - greenMonths}{" "}
              red. Best: {bestMonth.m} {fmtPct(bestMonth.r)}.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-[0.14em]"
          >
            <CalendarRange className="size-3 mr-1" /> 12 mo
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyReturns}
                margin={{ left: 0, right: 8, top: 8 }}
              >
                <CartesianGrid {...CHART_STYLE.grid} vertical={false} />
                <XAxis
                  dataKey="m"
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  formatter={(v) => (typeof v === "number" ? fmtPct(v) : "")}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="r" radius={[6, 6, 2, 2]}>
                  {monthlyReturns.map((m, i) => (
                    <Cell
                      key={i}
                      fill={m.r >= 0 ? "var(--primary)" : "var(--destructive)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* R distribution */}
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle
            className="text-base"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rDistributionMode === "r" ? "R-multiple distribution" : "Return % distribution"}
          </CardTitle>
          <CardDescription>
            {rDistributionMode === "r"
              ? "Right-tailed — your edge."
              : "No fixed stop-loss on this strategy, so bucketed by realized return % instead of R-multiple."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rDistribution}
                margin={{ left: 0, right: 8, top: 8 }}
              >
                <CartesianGrid {...CHART_STYLE.grid} vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={{ ...CHART_STYLE.tick, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={CHART_STYLE.tooltip} />
                <Bar dataKey="n" radius={[6, 6, 2, 2]}>
                  {rDistribution.map((b, i) => (
                    <Cell
                      key={i}
                      fill={
                        b.bucket.startsWith("-")
                          ? "var(--destructive)"
                          : b.bucket === "0R" || b.bucket === "0%"
                            ? "var(--muted-foreground)"
                            : "var(--primary)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
