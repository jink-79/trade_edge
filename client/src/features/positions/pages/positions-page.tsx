import { useMemo } from "react";
import { useJournalTrades } from "@/features/journal/hooks/use-journal";
import { usePreferences } from "@/features/preferences/hooks/use-preferences";
import { OpenPositionsHero } from "@/features/journal/components/open-positions-hero";
import { OpenPositionsKpis } from "@/features/journal/components/open-positions-kpis";
import { OpenPositionsTable } from "@/features/journal/components/open-positions-table";

export function PositionsPage() {
  const { data: trades = [], isLoading } = useJournalTrades();
  const { data: prefs } = usePreferences();
  const capital = prefs?.defaultCapital ?? 100000;

  const open = useMemo(
    () => trades.filter((t) => t.outcome === "STILL-OPEN"),
    [trades],
  );
  const needsReview = useMemo(
    () => open.filter((t) => t.needsReview).length,
    [open],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading positions…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          <OpenPositionsHero count={open.length} needsReview={needsReview} />
          <OpenPositionsKpis trades={open} capital={capital} />
          <OpenPositionsTable trades={open} capital={capital} />
        </div>
      </main>
    </div>
  );
}
