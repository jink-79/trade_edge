import { useMemo, useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// hooks
import {
  usePositions,
  useCreatePosition,
  enrichPosition,
  deriveSummary,
} from "../hooks/use-positions";

// components
import { PositionsStatsBar } from "../components/positions-stats-bar";
import { PositionsTable } from "../components/positions-table";
import { AddPositionForm } from "../components/add-position-form";

import { fmtINR } from "@/lib/positions-utils";
import type { CreatePositionPayload } from "../types/positions.types";

export function PositionsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = usePositions();
  const createMutation = useCreatePosition();

  const enriched = useMemo(
    () => (data ?? []).map(enrichPosition),
    [data],
  );
  const summary = useMemo(() => deriveSummary(enriched), [enriched]);

  const handleAdd = (payload: CreatePositionPayload) => {
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Position added.");
        setShowForm(false);
      },
      onError: (err: any) =>
        toast.error(
          err?.response?.data?.message ?? "Could not add position.",
        ),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading Positions...
      </div>
    );
  }

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {enriched.length} open positions
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
            Open Positions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deployed{" "}
            <span className="text-foreground tabular">
              {fmtINR(summary.totalInvested)}
            </span>{" "}
            across {enriched.length}{" "}
            {enriched.length === 1 ? "position" : "positions"}
          </p>
        </div>

        <Button
          onClick={() => setShowForm((v) => !v)}
          className={`gap-2 transition-all ${
            showForm
              ? "bg-secondary text-foreground hover:bg-secondary/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {showForm ? (
            <X className="size-4" />
          ) : (
            <PlusCircle className="size-4" />
          )}
          {showForm ? "Cancel" : "Add Position"}
        </Button>
      </div>

      {showForm && (
        <AddPositionForm
          onAdd={handleAdd}
          onClose={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* ── KPI CARDS ── */}
      <PositionsStatsBar summary={summary} />

      {/* ── TABLE ── */}
      {enriched.length === 0 ? (
        <div className="rounded-lg border border-border/60 bg-card/40 py-16 text-center text-sm text-muted-foreground">
          No open positions yet. Click{" "}
          <span className="text-foreground">Add Position</span> to log your
          first one.
        </div>
      ) : (
        <PositionsTable positions={enriched} />
      )}
    </div>
  );
}
