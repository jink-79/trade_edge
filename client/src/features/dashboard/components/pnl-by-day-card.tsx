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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const pnlByDay = [
  { day: "Mon", win: 1240, loss: -420 },
  { day: "Tue", win: 980, loss: -610 },
  { day: "Wed", win: 1820, loss: -280 },
  { day: "Thu", win: 640, loss: -890 },
  { day: "Fri", win: 2110, loss: -340 },
];

export function PnlByDayCard() {
  return (
    <Card
      className="col-span-12 xl:col-span-7 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-chart-3" /> P&L by Weekday
          </CardTitle>
          <CardDescription>
            Wins vs. losses across the trading week
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Legend dot="bg-primary" label="Wins" />
          <Legend dot="bg-destructive" label="Losses" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-65">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pnlByDay}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis
                dataKey="day"
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
                tickFormatter={(v) => `$${v}`}
                width={48}
              />
              <Tooltip
                content={<ChartTooltip prefix="$" />}
                cursor={{ fill: "oklch(1 0 0 / 4%)" }}
              />
              <Bar
                dataKey="win"
                fill="oklch(0.78 0.17 155)"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="loss"
                fill="oklch(0.68 0.21 22)"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`size-2 rounded-sm ${dot}`} />
      {label}
    </div>
  );
}
