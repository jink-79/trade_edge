import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LegendDot,
  MicroStat,
  fmtUsd,
  CHART_STYLE,
} from "./analytics-primitives";
import type { EquityPoint } from "../types/analytics.types";

interface EquityChartProps {
  data: EquityPoint[];
  benchPct: number;
  netPnlPct: number;
}

export function EquityChart({ data, benchPct, netPnlPct }: EquityChartProps) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Equity vs benchmark */}
      <Card className="xl:col-span-2 border-border/70 bg-card/60 backdrop-blur">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle
              className="text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Equity curve vs Nifty 50
            </CardTitle>
            <CardDescription>
              Your account compounded +{netPnlPct.toFixed(1)}% vs Nifty{" "}
              {benchPct.toFixed(1)}% YTD.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <LegendDot color="var(--primary)" label="You" />
            <LegendDot color="var(--chart-2)" label="Nifty 50" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="eqYou" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_STYLE.grid} vertical={false} />
                <XAxis
                  dataKey="d"
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  formatter={(v: number | undefined) =>
                    v !== undefined ? fmtUsd(v) : ""
                  }
                />
                <Area
                  type="monotone"
                  dataKey="you"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#eqYou)"
                />
                <Line
                  type="monotone"
                  dataKey="bench"
                  stroke="var(--chart-2)"
                  strokeWidth={1.75}
                  dot={false}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Drawdown */}
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle
            className="text-base"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Underwater (drawdown)
          </CardTitle>
          <CardDescription>Time spent below peak equity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--destructive)"
                      stopOpacity={0.05}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--destructive)"
                      stopOpacity={0.55}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_STYLE.grid} vertical={false} />
                <XAxis
                  dataKey="d"
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
                  formatter={(v: number | undefined) => v !== undefined ? `${v.toFixed(2)}%` : ""}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Area
                  type="monotone"
                  dataKey="dd"
                  stroke="var(--destructive)"
                  strokeWidth={1.5}
                  fill="url(#ddFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <MicroStat label="Max DD" value="-7.4%" />
            <MicroStat label="Avg DD" value="-2.1%" />
            <MicroStat label="Recovery" value="11d" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
