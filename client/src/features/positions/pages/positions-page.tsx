import { useMemo, useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateManualEntry, useJournalTrades } from "@/features/journal/hooks/use-journal";
import { usePreferences } from "@/features/preferences/hooks/use-preferences";
import { OpenPositionsHero } from "@/features/journal/components/open-positions-hero";
import { OpenPositionsKpis } from "@/features/journal/components/open-positions-kpis";
import { OpenPositionsTable } from "@/features/journal/components/open-positions-table";
import { AddEntryForm } from "@/features/journal/components/add-entry-form";
import { PositionsSkeleton } from "@/components/page-skeletons";
import type { ManualEntryPayload } from "@/features/journal/api/journal-api";

export function PositionsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: trades = [], isLoading } = useJournalTrades();
  const { data: prefs } = usePreferences();
  const capital = prefs?.defaultCapital ?? 100000;
  const addEntryMutation = useCreateManualEntry();

  const open = useMemo(
    () => trades.filter((t) => t.outcome === "STILL-OPEN"),
    [trades],
  );
  const needsReview = useMemo(
    () => open.filter((t) => t.needsReview).length,
    [open],
  );

  const handleAdd = (payload: ManualEntryPayload) => {
    addEntryMutation.mutate(payload, {
      onSuccess: (trade) => {
        toast.success(`${trade.entry.ticker} added to open positions.`);
        setShowForm(false);
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? "Could not add position."),
    });
  };

  if (isLoading) {
    return <PositionsSkeleton />;
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <OpenPositionsHero count={open.length} needsReview={needsReview} />
            <Button
              onClick={() => setShowForm((v) => !v)}
              className={`gap-2 transition-all ${
                showForm
                  ? "bg-secondary text-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {showForm ? <X className="size-4" /> : <PlusCircle className="size-4" />}
              {showForm ? "Cancel" : "Add Entry"}
            </Button>
          </div>

          {showForm && (
            <AddEntryForm
              onAdd={handleAdd}
              onClose={() => setShowForm(false)}
              isLoading={addEntryMutation.isPending}
            />
          )}

          <OpenPositionsKpis trades={open} capital={capital} />
          <OpenPositionsTable trades={open} capital={capital} />
        </div>
      </main>
    </div>
  );
}
