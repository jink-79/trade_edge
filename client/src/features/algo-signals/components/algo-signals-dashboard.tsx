import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLatestDailySignal } from "../hooks/use-algo-signals";
import { AlgoSignalsDailyView } from "./algo-signals-daily-view";
import { AlgoSignalsHistory } from "./algo-signals-history";

// Read-only validation view for phalanx-live's output (a separate repo/Atlas
// cluster). Currently daily (Trend+RS) only, per the feature's priority —
// weekly (Phalanx v7) reads from a near-identical shape and can be added as
// another tab later without changing this layout.
export function AlgoSignalsDashboard() {
  const { data: latest, isLoading, error } = useLatestDailySignal();

  return (
    <div className="px-8 py-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Algo Signals
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Read-only output of <code className="text-foreground">phalanx-live</code>'s daily Trend+RS
          scan. Signal-only — validates the engine, not TradeEdge's own trade tracking.
        </p>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          {isLoading ? (
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
          )}
        </TabsContent>

        <TabsContent value="history">
          <AlgoSignalsHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
