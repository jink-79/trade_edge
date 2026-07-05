import { ChartTooltip } from "@/components/common/chart-tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardPnlPoint } from "../types/dashboard.types";

interface PnlByDayCardProps {
  pnlChart: DashboardPnlPoint[];
}

export function PnlByDayCard({ pnlChart }: PnlByDayCardProps) {
  return (
    <Card
      className="col-span-12 xl:col-span-7 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-chart-3" /> Monthly P&L
          </CardTitle>
          <CardDescription>
            Realised profit &amp; loss by month (last 6)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-65">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pnlChart}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="oklch(0.66 0.015 250)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                stroke="oklch(0.66 0.015 250)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                content={<ChartTooltip prefix="₹" />}
                cursor={{ fill: "oklch(1 0 0 / 4%)" }}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {pnlChart.map((p, i) => (
                  <Cell
                    key={i}
                    fill={
                      p.pnl >= 0 ? "oklch(0.78 0.17 155)" : "oklch(0.68 0.21 22)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
