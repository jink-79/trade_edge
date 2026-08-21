import { useState } from "react";
import {
  Activity,
  Download,
  Filter,
  Gauge,
  LineChart as LineChartIcon,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// types
import { RANGES, type Range } from "../types/analytics.types";

// hooks
import { useAnalytics } from "../hooks/use-analytics";

// components
import { KpiTile } from "../components/analytics-primitives";
import { EquityChart } from "../components/equity-chart";
import { ReturnsCharts } from "../components/returns-charts";
import { SetupEdgeTable } from "../components/setup-edge-table";
import { ScatterSectorTime } from "../components/scatter-sector-time";
import { CalendarStreaks } from "../components/calendar-streaks";
import { AnalyticsSkeleton } from "@/components/page-skeletons";

export function AnalyticsPage() {
  const [range, setRange] = useState<Range>("YTD");

  const { data, isLoading } = useAnalytics(range);

  if (isLoading || !data) {
    return <AnalyticsSkeleton />;
  }

  const { stats } = data;

  return (
    <div className="px-6 lg:px-8 py-6 space-y-6 max-w-[1600px]">
      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
            <LineChartIcon className="size-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Performance
            </div>
            <h1
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Analytics
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Range pills */}
          <div className="flex items-center rounded-lg border border-border/70 bg-card/40 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors tabular ${
                  range === r
                    ? "bg-accent/70 text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-3.5" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <KpiTile
          icon={<TrendingUp className="size-4" />}
          label="Net P&L"
          value={`+$${stats.netPnl.toLocaleString()}`}
          delta={`+${stats.netPnlPct}%`}
          positive
        />
        <KpiTile
          icon={<Percent className="size-4" />}
          label="Win rate"
          value={`${stats.winRate.toFixed(1)}%`}
          delta="+2.1%"
          positive
        />
        <KpiTile
          icon={<Gauge className="size-4" />}
          label="Profit factor"
          value={stats.profitFactor.toFixed(2)}
          delta="vs 1.84"
          positive
        />
        <KpiTile
          icon={<Activity className="size-4" />}
          label="Sharpe"
          value={stats.sharpe != null ? stats.sharpe.toFixed(2) : "—"}
          delta={`Sortino ${stats.sortino != null ? stats.sortino.toFixed(2) : "—"}`}
          positive
        />
        <KpiTile
          icon={<Target className="size-4" />}
          label="Expectancy"
          value={`${stats.expectancy.toFixed(2)}R`}
          delta="per trade"
          positive
        />
        <KpiTile
          icon={<TrendingDown className="size-4" />}
          label="Max drawdown"
          value={`${stats.maxDd}%`}
          delta="recovered"
          positive={false}
        />
      </section>

      {/* ── SECTIONS ── */}
      <EquityChart
        data={data.equityVsBench}
        benchPct={stats.benchPct}
        netPnlPct={stats.netPnlPct}
      />

      <ReturnsCharts
        monthlyReturns={data.monthlyReturns}
        rDistribution={data.rDistribution}
        rDistributionMode={data.rDistributionMode}
      />

      <SetupEdgeTable setupEdge={data.setupEdge} radar={data.radar} />

      <ScatterSectorTime
        heldVsR={data.heldVsR}
        rDistributionMode={data.rDistributionMode}
        sectorPerf={data.sectorPerf}
        hourly={data.hourly}
      />

      <CalendarStreaks calendar={data.calendar} stats={stats} />

      <Separator className="opacity-40" />
      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Trade Edge · analytics derived from logged trades. Past performance ≠
        future results.
      </p>
    </div>
  );
}
