import { usePerformance } from "@/features/performance/hooks/use-performance";
import { PerformanceHero } from "@/features/performance/components/performance-hero";
import { PerformanceKpis } from "@/features/performance/components/performance-kpis";
import { EquityCurveCard } from "@/features/performance/components/equity-curve-card";
import { MetricGroups } from "@/features/performance/components/metric-groups";
import { MonthlyReturnsCard } from "@/features/performance/components/monthly-returns-card";
import { PerformanceSkeleton } from "@/components/page-skeletons";

export function PerformancePage() {
  const { data: perf, isLoading } = usePerformance();

  if (isLoading) {
    return <PerformanceSkeleton />;
  }

  if (!perf || !perf.metrics) {
    return (
      <div className="min-h-screen flex">
        <main className="flex-1 min-w-0">
          <div className="px-8 py-8 space-y-6 max-w-[1600px]">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">Performance</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                No backtest yet. Run the courier's{" "}
                <code className="text-foreground">backtest.py</code> after
                enriching signals — it computes the full metric suite from your
                resolved paper trades and posts it here.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          <PerformanceHero perf={perf} />
          <PerformanceKpis m={perf.metrics} />
          <EquityCurveCard
            equity={perf.equityCurve}
            benchmark={perf.benchmarkCurve}
          />
          <MetricGroups m={perf.metrics} />
          <MonthlyReturnsCard months={perf.monthlyReturns} />
        </div>
      </main>
    </div>
  );
}
