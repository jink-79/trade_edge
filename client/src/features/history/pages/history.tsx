import { useMemo } from "react";
import { useJournalTrades } from "@/features/journal/hooks/use-journal";
import { TradeHistoryHero } from "@/features/journal/components/trade-history-hero";
import {
  TradeHistoryKpis,
  metricsFor,
} from "@/features/journal/components/trade-history-kpis";
import { TradeHistoryTable } from "@/features/journal/components/trade-history-table";

export function HistoryPage() {
  const { data: trades = [], isLoading } = useJournalTrades();

  const closed = useMemo(
    () => trades.filter((t) => t.outcome !== "STILL-OPEN" && t.exit),
    [trades],
  );
  const winners = useMemo(
    () => closed.filter((t) => (metricsFor(t)?.realizedPnl ?? 0) > 0).length,
    [closed],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading trade history…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          <TradeHistoryHero count={closed.length} winners={winners} />
          <TradeHistoryKpis trades={closed} />
          <TradeHistoryTable trades={closed} />
        </div>
      </main>
    </div>
  );
}
