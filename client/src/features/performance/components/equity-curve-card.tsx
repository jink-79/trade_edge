import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
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
import type {
  BenchmarkPoint,
  EquityPoint,
} from "../types/performance.types";

const fmtL = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export function EquityCurveCard({
  equity,
  benchmark,
}: {
  equity: EquityPoint[];
  benchmark: BenchmarkPoint[];
}) {
  const data = useMemo(() => {
    const byDate = new Map<string, { date: string; equity?: number; nifty?: number }>();
    for (const p of equity)
      if (p.equity != null) byDate.set(p.date, { date: p.date, equity: p.equity });
    for (const b of benchmark) {
      if (b.value == null) continue;
      const row = byDate.get(b.date) ?? { date: b.date };
      row.nifty = b.value;
      byDate.set(b.date, row);
    }
    return Array.from(byDate.values()).sort((a, b) =>
      a.date < b.date ? -1 : 1,
    );
  }, [equity, benchmark]);

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle
          className="text-base"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Equity curve
        </CardTitle>
        <CardDescription>
          Paper portfolio (1% risk / trade) vs Nifty 50, rebased to the same
          start.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {data.length < 2 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              Equity curve appears once trades resolve.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={fmtL}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  width={52}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => fmtDate(String(l))}
                  formatter={(v) => (typeof v === "number" ? fmtL(v) : "")}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  name="Strategy"
                  stroke="var(--primary)"
                  fill="url(#eq)"
                  strokeWidth={2}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="nifty"
                  name="Nifty 50"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
