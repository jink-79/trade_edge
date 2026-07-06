import {
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MicroStat, Insight, fmtUsd, fmtPct } from "./analytics-primitives";
import type { CalendarDay, AnalyticsStats } from "../types/analytics.types";

interface CalendarStreaksProps {
  calendar: CalendarDay[];
  stats: AnalyticsStats;
}

export function CalendarStreaks({ calendar, stats }: CalendarStreaksProps) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Calendar heatmap */}
      <Card className="xl:col-span-2 border-border/70 bg-card/60 backdrop-blur">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle
              className="text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Daily returns — last 5 weeks
            </CardTitle>
            <CardDescription>Each cell is a trading session.</CardDescription>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Loss</span>
            <div className="flex gap-0.5">
              {[0.15, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                <span
                  key={`d${i}`}
                  className="size-3 rounded-sm"
                  style={{
                    background: `color-mix(in oklab, var(--destructive) ${o * 100}%, transparent)`,
                  }}
                />
              ))}
              <span className="size-3 rounded-sm bg-muted/40" />
              {[0.15, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                <span
                  key={`u${i}`}
                  className="size-3 rounded-sm"
                  style={{
                    background: `color-mix(in oklab, var(--primary) ${o * 100}%, transparent)`,
                  }}
                />
              ))}
            </div>
            <span>Win</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.14em]"
              >
                {d}
              </div>
            ))}
            {calendar.map((c) => {
              const intensity = Math.min(1, Math.abs(c.r) / 2.5);
              const bg =
                c.r === 0
                  ? "var(--muted)"
                  : c.r > 0
                    ? `color-mix(in oklab, var(--primary) ${15 + intensity * 75}%, transparent)`
                    : `color-mix(in oklab, var(--destructive) ${15 + intensity * 75}%, transparent)`;
              return (
                <div
                  key={c.d}
                  title={fmtPct(c.r)}
                  className="aspect-square rounded-md ring-1 ring-border/40 flex items-end justify-end p-1 text-[9px] text-foreground/70 tabular"
                  style={{ background: bg }}
                >
                  {c.d}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Streaks + AI */}
      <div className="space-y-4">
        <Card className="border-border/70 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle
              className="text-base flex items-center gap-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <Flame className="size-4 text-primary" /> Streaks & extremes
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <MicroStat
              label="Best streak"
              value={`${stats.bestStreak}W`}
              accent="primary"
            />
            <MicroStat
              label="Worst streak"
              value={`${stats.worstStreak}L`}
              accent="destructive"
            />
            <MicroStat label="Avg win" value={fmtUsd(stats.avgWin)} />
            <MicroStat label="Avg loss" value={fmtUsd(stats.avgLoss)} />
            <MicroStat label="Payoff" value={`${stats.payoff.toFixed(2)}x`} />
            <MicroStat label="Avg hold" value={stats.avgHold} />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-card/60 backdrop-blur">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(400px 200px at 110% -10%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 60%)",
            }}
          />
          <CardHeader className="relative">
            <CardTitle
              className="text-base flex items-center gap-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <Sparkles className="size-4 text-primary" /> Edge AI insights
            </CardTitle>
            <CardDescription>
              3 patterns worth acting on this week.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <Insight
              tone="positive"
              icon={<ArrowUpRight className="size-3.5" />}
              title="Breakouts on Tech are paying 1.42R"
              body="Up-size by 25% when ATR > 1.8 and RVOL > 2."
            />
            <Insight
              tone="negative"
              icon={<ArrowDownRight className="size-3.5" />}
              title="Reversals bleed -0.22R on average"
              body="46 trades, win rate 41%. Consider pausing the setup for 30 days."
            />
            <Insight
              tone="neutral"
              icon={<Zap className="size-3.5" />}
              title="Lunch hour (12–13) is a drag"
              body="-$550 cumulative. Block new entries between 11:55 and 13:05."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
