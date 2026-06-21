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

const allocation = [
  { name: "Equities", value: 46, color: "var(--chart-1)" },
  { name: "Options", value: 24, color: "var(--chart-2)" },
  { name: "Futures", value: 18, color: "var(--chart-3)" },
  { name: "Crypto", value: 12, color: "var(--chart-5)" },
];

export function AllocationCard() {
  return (
    <Card
      className="col-span-12 xl:col-span-4 border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieChartIcon className="size-4 text-chart-2" /> Allocation
        </CardTitle>
        <CardDescription>Capital deployed by instrument</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-50">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                stroke="none"
              >
                {allocation.map((a, i) => (
                  <Cell key={i} fill={a.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip suffix="%" />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-2">
          {allocation.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ background: a.color as string }}
                />
                <span className="text-muted-foreground">{a.name}</span>
              </div>
              <span className="tabular">{a.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
