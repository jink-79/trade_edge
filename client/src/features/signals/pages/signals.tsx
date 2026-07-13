import { useMemo, useState } from "react";
import { Zap } from "lucide-react";

import { useWeeklySignals, enrichSignal } from "../hooks/useSignals";
import { WeekSelector, weekLabel } from "../components/week-selector";
import { SignalStatsBar } from "../components/signal-stats-bar";
import { SignalTable } from "../components/signal-table";

export function SignalsPage() {
  const { data, isLoading, isError } = useWeeklySignals(8);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const weeks = data?.data ?? [];

  // Default to the latest week once data arrives
  const activeKey =
    selectedWeek ?? (weeks[0] ? (weeks[0].week ?? weeks[0].signalWeek) : null);

  const activeWeek = useMemo(
    () => weeks.find((w) => (w.week ?? w.signalWeek) === activeKey) ?? weeks[0],
    [weeks, activeKey],
  );

  const enriched = useMemo(
    () => (activeWeek?.stocks ?? []).map(enrichSignal),
    [activeWeek],
  );

  return (
    <div className="px-8 py-8 space-y-6 max-w-[1600px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Weekly Entry Scanner
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
            Signal Feed
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly breakout candidates from the scanner ·{" "}
            <span className="text-foreground">
              {activeWeek ? weekLabel(activeWeek) : "—"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs">
          <Zap className="size-3.5 text-primary" />
          <div>
            <p className="font-medium">PULSE BREAKER</p>
            <p className="text-muted-foreground">
              2-candle breakout · volume vs 20W avg
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading signals…
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center h-48 text-destructive text-sm">
          Failed to load signals. Please try again.
        </div>
      )}

      {!isLoading && !isError && weeks.length === 0 && (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No scanner results yet.
        </div>
      )}

      {activeWeek && (
        <>
          <WeekSelector
            weeks={weeks}
            selectedWeek={activeWeek.week ?? activeWeek.signalWeek}
            onChange={setSelectedWeek}
          />
          <SignalStatsBar signals={enriched} />
          <SignalTable signals={enriched} />
        </>
      )}
    </div>
  );
}
