import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_STYLE, fmtINR } from "./analytics-primitives";
import type { SetupEdge, RadarPoint } from "../types/analytics.types";
import { Brain } from "lucide-react";

interface SetupEdgeTableProps {
  setupEdge: SetupEdge[];
  radar: RadarPoint[];
}

export function SetupEdgeTable({ setupEdge, radar }: SetupEdgeTableProps) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Edge by setup */}
      <Card className="xl:col-span-2 border-border/70 bg-card/60 backdrop-blur">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle
              className="text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Edge by setup
            </CardTitle>
            <CardDescription>
              Where you actually make money. Cut what bleeds.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-[0.14em]"
          >
            <Award className="size-3 mr-1" /> playbook
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          {setupEdge.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No closed trades in this range yet.
            </div>
          ) : (
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="text-left  font-medium px-3 py-2.5">Setup</th>
                  <th className="text-right font-medium px-3 py-2.5">Trades</th>
                  <th className="text-right font-medium px-3 py-2.5">Win %</th>
                  <th className="text-left  font-medium px-3 py-2.5 w-[30%]">
                    Win rate
                  </th>
                  <th className="text-right font-medium px-3 py-2.5">
                    Expectancy
                  </th>
                  <th className="text-right font-medium px-3 py-2.5">
                    Verdict
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {setupEdge.map((s) => {
                  const good = s.exp > 0;
                  return (
                    <tr
                      key={s.setup}
                      className="hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-3 py-2.5 font-medium">{s.setup}</td>
                      <td className="px-3 py-2.5 text-right tabular text-muted-foreground">
                        {s.trades}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular">
                        {s.win}%
                      </td>
                      <td className="px-3 py-2.5">
                        <Progress value={s.win} className="h-1.5" />
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right tabular font-medium ${good ? "text-primary" : "text-destructive"}`}
                      >
                        {good ? "+" : ""}
                        {fmtINR(s.exp)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-[0.14em] ${
                            good
                              ? "border-primary/40 text-primary"
                              : "border-destructive/40 text-destructive"
                          }`}
                        >
                          {good ? "scale" : "cut"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Skill radar */}
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Brain className="size-4 text-primary" /> Trader skill profile
          </CardTitle>
          <CardDescription>Computed across 6 dimensions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="78%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="k" tick={CHART_STYLE.tick} />
                <Radar
                  dataKey="v"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={CHART_STYLE.tooltip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
