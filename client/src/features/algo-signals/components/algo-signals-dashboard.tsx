import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLatestDailySignal } from "../hooks/use-algo-signals";
import { AlgoSignalsHero } from "./algo-signals-hero";
import { AlgoSignalsDailyView } from "./algo-signals-daily-view";
import { AlgoSignalsHistory } from "./algo-signals-history";

// Read-only validation view for phalanx-live's output (a separate repo/Atlas
// cluster). Currently daily (Trend+RS) only, per the feature's priority —
// weekly (Phalanx v7) reads from a near-identical shape and can be added as
// another view later without changing this layout.
export function AlgoSignalsDashboard() {
  const { data: latest, isLoading, error } = useLatestDailySignal();
  const [view, setView] = useState<"today" | "history">("today");

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <AlgoSignalsHero latest={latest ?? null} />

      <div className="flex gap-2">
        <Button size="sm" variant={view === "today" ? "default" : "outline"} onClick={() => setView("today")}>
          Today
        </Button>
        <Button size="sm" variant={view === "history" ? "default" : "outline"} onClick={() => setView("history")}>
          History
        </Button>
      </div>

      {view === "today" ? (
        isLoading ? (
          <p className="text-sm text-muted-foreground">Loading latest signal…</p>
        ) : error ? (
          <p className="text-sm text-destructive">
            Couldn't load Algo Signals — the phalanx connection may not be configured yet.
          </p>
        ) : !latest ? (
          <p className="text-sm text-muted-foreground">
            No daily signals yet. phalanx-live runs weekday evenings.
          </p>
        ) : (
          <AlgoSignalsDailyView doc={latest} />
        )
      ) : (
        <AlgoSignalsHistory />
      )}
    </div>
  );
}
