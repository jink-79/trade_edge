import { ChartTooltip } from "@/components/common/chart-tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmtINR } from "@/lib/positions-utils";
import type { DashboardPortfolio } from "../types/dashboard.types";

interface AllocationCardProps {
  portfolio: DashboardPortfolio;
}

export function AllocationCard({ portfolio }: AllocationCardProps) {
  const segments = [
    {
      name: "Open Positions",
      value: portfolio.totalOpenInvested,
      color: "var(--chart-1)",
    },
    {
      name: "Mutual Funds",
      value: portfolio.totalMfInvested,
      color: "var(--chart-2)",
    },
    {
      name: "Cash / Funds",
      value: portfolio.totalFundsDeposited,
      color: "var(--chart-3)",
    },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((s, a) => s + a.value, 0);

  return (
    <Card
      className="col-span-12 xl:col-span-4 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieChartIcon className="size-4 text-chart-2" /> Allocation
        </CardTitle>
        <CardDescription>Capital deployed across the book</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-50 grid place-items-center text-sm text-muted-foreground">
            No capital deployed yet.
          </div>
        ) : (
          <>
            <div className="h-50">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {segments.map((a, i) => (
                      <Cell key={i} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip prefix="₹" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {segments.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-sm"
                      style={{ background: a.color }}
                    />
                    <span className="text-muted-foreground">{a.name}</span>
                  </div>
                  <span className="tabular">
                    {fmtINR(a.value)}{" "}
                    <span className="text-muted-foreground">
                      ({((a.value / total) * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
