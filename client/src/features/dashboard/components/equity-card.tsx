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

const equityCurve = [
  { d: "Jan 02", v: 25000 },
  { d: "Jan 09", v: 25840 },
  { d: "Jan 16", v: 26110 },
  { d: "Jan 23", v: 25620 },
  { d: "Jan 30", v: 27210 },
  { d: "Feb 06", v: 28140 },
  { d: "Feb 13", v: 27880 },
  { d: "Feb 20", v: 29320 },
  { d: "Feb 27", v: 30410 },
  { d: "Mar 06", v: 31580 },
  { d: "Mar 13", v: 30940 },
  { d: "Mar 20", v: 32710 },
  { d: "Mar 27", v: 34120 },
  { d: "Apr 03", v: 33480 },
  { d: "Apr 10", v: 35260 },
  { d: "Apr 17", v: 36980 },
  { d: "Apr 24", v: 38420 },
  { d: "May 01", v: 37610 },
  { d: "May 08", v: 39870 },
  { d: "May 15", v: 41230 },
];

export function EquityCard() {
  const fmtUsd2 = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  return (
    <Card
      className="col-span-12 xl:col-span-8 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <LineChartIcon className="size-4 text-primary" /> Equity Curve
          </CardTitle>
          <CardDescription className="mt-1">
            Account value over the last 20 weeks
          </CardDescription>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular">{fmtUsd2(41230)}</div>
          <div className="text-xs text-primary tabular">+$16,230 ▲ 18.4%</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-70">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={equityCurve}
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
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={42}
              />
              <Tooltip
                content={<ChartTooltip prefix="$" />}
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
