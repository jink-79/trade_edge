import {
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHART_STYLE, fmtINR } from "./analytics-primitives";
import type { ScatterPoint, SectorPerf } from "../types/analytics.types";

interface ScatterSectorTimeProps {
  heldVsR: ScatterPoint[];
  rDistributionMode: "r" | "pct";
  sectorPerf: SectorPerf[];
}

export function ScatterSectorTime({
  heldVsR,
  rDistributionMode,
  sectorPerf,
}: ScatterSectorTimeProps) {
  const maxSectorAbs = Math.max(1, ...sectorPerf.map((s) => Math.abs(s.pnl)));

  // Plot hold time in days, not raw minutes — this is a daily-timeframe
  // strategy (multi-day swing holds), so "held for 8640m" is unreadable.
  const heldVsRDays = heldVsR.map((p) => ({ ...p, xDays: p.x / 1440 }));
  const avgHeldDays =
    heldVsRDays.length > 0
      ? heldVsRDays.reduce((s, p) => s + p.xDays, 0) / heldVsRDays.length
      : 0;
  const winners = heldVsRDays.filter((p) => p.y >= 0);
  const avgWinnerHeldDays =
    winners.length > 0 ? winners.reduce((s, p) => s + p.xDays, 0) / winners.length : 0;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Held days vs R/return scatter */}
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle
            className="text-base"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rDistributionMode === "r" ? "Hold time vs R" : "Hold time vs return %"}
          </CardTitle>
          <CardDescription>
            {heldVsRDays.length === 0
              ? "No closed trades in this range yet."
              : winners.length > 0
                ? `Winners held ${avgWinnerHeldDays.toFixed(1)}d on average, vs ${avgHeldDays.toFixed(1)}d overall.`
                : `${avgHeldDays.toFixed(1)}d average hold — no winners in this range yet.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid {...CHART_STYLE.grid} />
                <XAxis
                  type="number"
                  dataKey="xDays"
                  name="days held"
                  unit="d"
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
                  formatter={(v, name) =>
                    name === "days held" && typeof v === "number" ? `${v.toFixed(1)}d` : v
                  }
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Scatter data={heldVsRDays}>
                  {heldVsRDays.map((p, i) => (
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
            {sectorPerf.length === 0
              ? "No closed trades in this range yet."
              : `${sectorPerf.slice().sort((a, b) => b.pnl - a.pnl)[0].sector} leads this range.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {sectorPerf.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No closed trades in this range yet.
            </p>
          ) : (
            sectorPerf
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
                        {fmtINR(Math.abs(s.pnl))}
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
              })
          )}
        </CardContent>
      </Card>
    </section>
  );
}
