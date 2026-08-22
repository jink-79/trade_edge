import {
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MicroStat, Insight, fmtINR, fmtPct } from "./analytics-primitives";
import type { CalendarDay, AnalyticsStats, SetupEdge, SectorPerf } from "../types/analytics.types";

interface CalendarStreaksProps {
  calendar: CalendarDay[];
  stats: AnalyticsStats;
  setupEdge: SetupEdge[];
  sectorPerf: SectorPerf[];
}

const MIN_SAMPLE = 3;

/** Real, derived-from-your-own-trades insights — not AI, just the two most
 * informative facts already sitting in setupEdge/sectorPerf, surfaced
 * directly instead of buried in a table. Gated on a minimum sample size so
 * a single lucky/unlucky trade doesn't read as a confident pattern. */
function buildInsights(setupEdge: SetupEdge[], sectorPerf: SectorPerf[]) {
  const eligible = setupEdge.filter((s) => s.trades >= MIN_SAMPLE);
  const bestSetup = eligible.length
    ? eligible.reduce((a, b) => (b.exp > a.exp ? b : a))
    : null;
  const worstSetup = eligible.length
    ? eligible.reduce((a, b) => (b.exp < a.exp ? b : a))
    : null;

  const sectorsEligible = sectorPerf.filter((s) => s.trades >= MIN_SAMPLE);
  const bestSector = sectorsEligible.length
    ? sectorsEligible.reduce((a, b) => (b.pnl > a.pnl ? b : a))
    : null;

  const insights: { tone: "positive" | "negative" | "neutral"; title: string; body: string }[] = [];

  if (bestSetup && bestSetup.exp > 0) {
    insights.push({
      tone: "positive",
      title: `${bestSetup.setup} exits are your best performer`,
      body: `${bestSetup.win.toFixed(0)}% win rate across ${bestSetup.trades} trades, averaging ${fmtINR(bestSetup.exp)}/trade.`,
    });
  }
  if (worstSetup && worstSetup.exp < 0 && worstSetup.setup !== bestSetup?.setup) {
    insights.push({
      tone: "negative",
      title: `${worstSetup.setup} exits are bleeding`,
      body: `${worstSetup.win.toFixed(0)}% win rate across ${worstSetup.trades} trades, averaging ${fmtINR(worstSetup.exp)}/trade.`,
    });
  }
  if (bestSector) {
    insights.push({
      tone: bestSector.pnl >= 0 ? "positive" : "negative",
      title: `${bestSector.sector} is your strongest sector`,
      body: `${bestSector.pnl >= 0 ? "+" : ""}${fmtINR(bestSector.pnl)} across ${bestSector.trades} trades.`,
    });
  }

  return insights;
}

export function CalendarStreaks({ calendar, stats, setupEdge, sectorPerf }: CalendarStreaksProps) {
  const insights = buildInsights(setupEdge, sectorPerf);

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
              Daily returns — this month
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
          {calendar.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No closed trades this month yet.
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Streaks + insights */}
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
            <MicroStat label="Avg win" value={fmtINR(stats.avgWin)} />
            <MicroStat label="Avg loss" value={fmtINR(stats.avgLoss)} />
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
              <Sparkles className="size-4 text-primary" /> Edge insights
            </CardTitle>
            <CardDescription>
              {insights.length > 0
                ? `${insights.length} pattern${insights.length > 1 ? "s" : ""} from your own trades.`
                : `Need at least ${MIN_SAMPLE} trades in a category before surfacing a pattern.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Not enough closed trades yet to surface a reliable pattern.
              </p>
            ) : (
              insights.map((i) => (
                <Insight
                  key={i.title}
                  tone={i.tone}
                  icon={
                    i.tone === "positive" ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : i.tone === "negative" ? (
                      <ArrowDownRight className="size-3.5" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )
                  }
                  title={i.title}
                  body={i.body}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
