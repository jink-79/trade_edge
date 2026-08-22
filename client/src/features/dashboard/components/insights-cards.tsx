import { useMemo } from "react";
import {
  BarChart3,
  Building2,
  Crosshair,
  Flame,
  Percent,
  Scale,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fmtINR } from "@/lib/positions-utils";
import { KpiCard } from "./kpi-card";
import type {
  DashboardRMultipleBucket,
  DashboardSectorConcentration,
  DashboardSegmentStats,
  DashboardSegmentedPerformance,
  DashboardExpectancy,
  DashboardMfeCapture,
  DashboardStreak,
} from "../types/dashboard.types";

const cardShell = "border-border/70 bg-card/70";
const cardShadow = { boxShadow: "var(--shadow-card)" } as const;

// ── MFE capture ────────────────────────────────────────────────────────────────

export function MfeCaptureCard({ mfeCapture }: { mfeCapture: DashboardMfeCapture }) {
  const { avgCapturePct, sampleSize } = mfeCapture;
  return (
    <KpiCard
      icon={Crosshair}
      label="MFE Capture"
      value={avgCapturePct != null ? `${avgCapturePct.toFixed(0)}%` : "—"}
      positive={avgCapturePct != null ? avgCapturePct >= 50 : true}
      foot={
        sampleSize > 0
          ? `of max favorable move, avg over ${sampleSize} trade${sampleSize > 1 ? "s" : ""}`
          : "no analytics yet"
      }
    />
  );
}

// ── Streak ─────────────────────────────────────────────────────────────────────

export function StreakCard({ streak }: { streak: DashboardStreak }) {
  const { current, bestWinStreak, worstLossStreak } = streak;
  const label = current === 0 ? "—" : `${Math.abs(current)} ${current > 0 ? "win" : "loss"}${Math.abs(current) > 1 ? "s" : ""}`;
  return (
    <KpiCard
      icon={Flame}
      label="Current Streak"
      value={label}
      positive={current >= 0}
      foot={`best W${bestWinStreak} · worst L${worstLossStreak}`}
    />
  );
}

// ── Expectancy ─────────────────────────────────────────────────────────────────

export function ExpectancyCard({ expectancy }: { expectancy: DashboardExpectancy }) {
  const { winRate, avgWin, avgLoss, expectancyPerTrade, expectancyR } = expectancy;
  const positive = expectancyPerTrade >= 0;

  return (
    <Card className={cn(cardShell, "relative overflow-hidden ring-1 ring-primary/20")} style={cardShadow}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, oklch(0.78 0.17 155 / 14%), transparent 60%)",
        }}
      />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] uppercase tracking-[0.16em]">
            Expectancy / trade
          </CardDescription>
          <div className="size-7 rounded-md bg-accent/60 grid place-items-center ring-1 ring-border/70">
            <Scale className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="flex items-baseline gap-2">
          <div className={cn("text-2xl font-semibold tabular tracking-tight", positive ? "text-primary" : "text-destructive")}>
            {positive ? "+" : ""}
            {fmtINR(expectancyPerTrade)}
          </div>
          {expectancyR != null && (
            <span className="text-xs text-muted-foreground tabular">
              ({expectancyR >= 0 ? "+" : ""}
              {expectancyR.toFixed(2)}R)
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Win rate</div>
            <div className="tabular font-medium mt-0.5">{winRate.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg win</div>
            <div className="tabular font-medium mt-0.5 text-primary">{fmtINR(avgWin)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg loss</div>
            <div className="tabular font-medium mt-0.5 text-destructive">
              −{fmtINR(avgLoss)}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          What the system is worth per trade, on average — trust this through a
          losing streak more than any single trade's outcome.
        </p>
      </CardContent>
    </Card>
  );
}

// ── R-multiple distribution ──────────────────────────────────────────────────

export function RMultipleHistogramCard({ buckets }: { buckets: DashboardRMultipleBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <Card className={cardShell} style={cardShadow}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="size-4 text-chart-1" /> R-Multiple Distribution
        </CardTitle>
        <CardDescription>Shape of outcomes across closed trades</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No closed trades with a computable R yet.
          </div>
        ) : (
          <div className="flex items-end gap-2 h-36">
            {buckets.map((b) => {
              const negative = b.label.trim().startsWith("<") || b.label.trim().startsWith("-");
              const heightPct = (b.count / max) * 100;
              return (
                <div key={b.label} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] tabular text-muted-foreground">{b.count}</span>
                  <div
                    className={cn(
                      "w-full rounded-sm min-h-[3px]",
                      negative ? "bg-destructive/60" : "bg-primary/60",
                    )}
                    style={{ height: `${Math.max(heightPct, b.count > 0 ? 4 : 0)}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground text-center leading-tight whitespace-nowrap">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Segmented performance (rule adherence / market regime) ─────────────────────

function SegmentRow({ label, stats }: { label: string; stats: DashboardSegmentStats | null }) {
  if (!stats) {
    return (
      <div className="flex-1 min-w-0 rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm text-muted-foreground">No trades</div>
      </div>
    );
  }
  const positive = stats.avgPnl >= 0;
  return (
    <div className="flex-1 min-w-0 rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tabular">{stats.winRate.toFixed(0)}%</span>
        <span className="text-[10px] text-muted-foreground">win rate</span>
      </div>
      <div className={cn("text-xs tabular mt-0.5", positive ? "text-primary" : "text-destructive")}>
        avg {positive ? "+" : ""}
        {fmtINR(stats.avgPnl)}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {stats.trades} trade{stats.trades > 1 ? "s" : ""}
      </div>
    </div>
  );
}

export function SegmentedPerformanceCard({
  segmented,
}: {
  segmented: DashboardSegmentedPerformance;
}) {
  return (
    <Card className={cardShell} style={cardShadow}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Percent className="size-4 text-chart-3" /> Segmented Performance
        </CardTitle>
        <CardDescription>Where the edge actually holds up</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rule">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rule">Rule adherence</TabsTrigger>
            <TabsTrigger value="regime">Market regime</TabsTrigger>
          </TabsList>
          <TabsContent value="rule" className="mt-3">
            <div className="flex gap-2.5">
              <SegmentRow label="Followed system" stats={segmented.ruleAdherence.system} />
              <SegmentRow label="Discretionary" stats={segmented.ruleAdherence.discretionary} />
            </div>
          </TabsContent>
          <TabsContent value="regime" className="mt-3">
            <div className="flex gap-2.5">
              <SegmentRow label="Nifty above 200 EMA" stats={segmented.regime.up} />
              <SegmentRow label="Nifty below 200 EMA" stats={segmented.regime.down} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ── Sector concentration (open positions) ────────────────────────────────────

export function SectorConcentrationCard({
  sectors,
}: {
  sectors: DashboardSectorConcentration[];
}) {
  const top = useMemo(() => sectors.slice(0, 5), [sectors]);

  return (
    <Card className={cardShell} style={cardShadow}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="size-4 text-chart-4" /> Sector Concentration
        </CardTitle>
        <CardDescription>Open capital by sector — correlated-risk check</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No open positions yet.
          </div>
        ) : (
          top.map((s) => (
            <div key={s.sector} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate">{s.sector}</span>
                <span className="tabular">
                  {fmtINR(s.invested)}{" "}
                  <span className="text-muted-foreground">({s.pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    s.pct >= 40 ? "bg-destructive/70" : "bg-primary/70",
                  )}
                  style={{ width: `${Math.min(100, s.pct)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
