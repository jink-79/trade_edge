import { ChartTooltip } from "@/components/common/chart-tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChartIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtINR } from "@/lib/positions-utils";
import type {
  DashboardPnlPoint,
  DashboardPortfolio,
} from "../types/dashboard.types";

interface EquityCardProps {
  pnlChart: DashboardPnlPoint[];
  portfolio: DashboardPortfolio;
  netPnl: number;
}

export function EquityCard({ pnlChart, portfolio, netPnl }: EquityCardProps) {
  const data = pnlChart.map((p) => ({ d: p.month, v: p.cumulative }));
  const pnlPos = netPnl >= 0;

  return (
    <Card
      className="col-span-12 xl:col-span-8 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <LineChartIcon className="size-4 text-primary" /> Cumulative P&L
          </CardTitle>
          <CardDescription className="mt-1">
            Realised P&L over the last 6 months
          </CardDescription>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular">
            {fmtINR(portfolio.totalValue)}
          </div>
          <div
            className={`text-xs tabular ${pnlPos ? "text-primary" : "text-destructive"}`}
          >
            {pnlPos ? "+" : ""}
            {fmtINR(netPnl)} realised
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-70">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="oklch(0.78 0.17 155)"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor="oklch(0.78 0.17 155)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis
                dataKey="d"
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
                cursor={{ stroke: "oklch(1 0 0 / 15%)" }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="oklch(0.78 0.17 155)"
                strokeWidth={2}
                fill="url(#eq)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
