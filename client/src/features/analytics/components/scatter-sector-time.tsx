import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHART_STYLE, fmtUsd } from "./analytics-primitives";
import type {
  ScatterPoint,
  SectorPerf,
  HourlyPnl,
} from "../types/analytics.types";

interface ScatterSectorTimeProps {
  heldVsR: ScatterPoint[];
  rDistributionMode: "r" | "pct";
  sectorPerf: SectorPerf[];
  hourly: HourlyPnl[];
}

export function ScatterSectorTime({
  heldVsR,
  rDistributionMode,
  sectorPerf,
  hourly,
}: ScatterSectorTimeProps) {
  const maxSectorAbs = Math.max(...sectorPerf.map((s) => Math.abs(s.pnl)));

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Hold time vs R scatter */}
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle
            className="text-base"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rDistributionMode === "r" ? "Hold time vs R" : "Hold time vs return %"}
          </CardTitle>
          <CardDescription>
            {rDistributionMode === "r"
              ? "Sweet spot: 30-90 min holds."
              : "No fixed stop-loss on this strategy — plotted against realized return % instead."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid {...CHART_STYLE.grid} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="min"
                  unit="m"
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={rDistributionMode === "r" ? "R" : "%"}
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (rDistributionMode === "r" ? `${v}R` : `${v}%`)}
                />
                <ZAxis type="number" dataKey="z" range={[40, 180]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={CHART_STYLE.tooltip}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Scatter data={heldVsR}>
                  {heldVsR.map((p, i) => (
                    <Cell
                      key={i}
                      fill={p.y >= 0 ? "var(--primary)" : "var(--destructive)"}
                      fillOpacity={0.75}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* P&L by sector */}
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle
            className="text-base"
            style={{ fontFamily: "var(--font-display)" }}
          >
            P&L by sector
          </CardTitle>
          <CardDescription>
            {sectorPerf.slice().sort((a, b) => b.pnl - a.pnl)[0].sector} leads
            the year.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {sectorPerf
            .slice()
            .sort((a, b) => b.pnl - a.pnl)
            .map((s) => {
              const w = (Math.abs(s.pnl) / maxSectorAbs) * 100;
              const positive = s.pnl >= 0;
              return (
                <div key={s.sector} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{s.sector}</span>
                    <span
                      className={`tabular ${positive ? "text-primary" : "text-destructive"}`}
                    >
                      {positive ? "+" : "-"}
                      {fmtUsd(Math.abs(s.pnl))}
                      <span className="text-muted-foreground">
                        {" "}
                        · {s.trades}t
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${w}%`,
                        background: positive
                          ? "var(--gradient-success)"
                          : "var(--gradient-danger)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* P&L by time of day */}
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Clock className="size-4 text-primary" /> P&L by time of day
          </CardTitle>
          <CardDescription>Open and power hour are your edge.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid {...CHART_STYLE.grid} vertical={false} />
                <XAxis
                  dataKey="h"
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={CHART_STYLE.tick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  formatter={(v) => (typeof v === "number" ? fmtUsd(v) : "")}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="pnl" radius={[6, 6, 2, 2]}>
                  {hourly.map((h, i) => (
                    <Cell
                      key={i}
                      fill={
                        h.pnl >= 0 ? "var(--primary)" : "var(--destructive)"
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
