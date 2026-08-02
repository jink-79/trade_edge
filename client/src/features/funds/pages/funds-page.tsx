import { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// hooks
import { useFunds, useAddFund, useDeleteFund } from "../hooks/use-funds";

// components
import { FundsStatsBar } from "../components/funds-stats-bar";
import { AddFundForm } from "../components/add-fund-form";
import { FundsTable } from "../components/funds-table";
import { FundsSkeleton } from "@/components/page-skeletons";

import type { AddFundPayload, FundsSummary } from "../types/funds.types";

const EMPTY_SUMMARY: FundsSummary = {
  totalFunds: 0,
  totalEntries: 0,
  byType: { trading: 0, savings: 0, emergency: 0, other: 0 },
};

export function FundsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useFunds();
  const addFundMutation = useAddFund();
  const deleteFundMutation = useDeleteFund();

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const funds = data?.data ?? [];

  const handleAdd = (payload: AddFundPayload) => {
    addFundMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Fund entry added.");
        setShowForm(false);
      },
      onError: (err: any) =>
        toast.error(
          err?.response?.data?.message ?? "Could not add fund entry.",
        ),
    });
  };

  const handleDelete = (id: string) => {
    deleteFundMutation.mutate(id, {
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? "Could not delete entry."),
    });
  };

  if (isLoading) {
    return <FundsSkeleton />;
  }

  return (
    <div className="px-8 py-8 space-y-6 max-w-[1600px]">
      {/* ── HERO ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Capital · Fund Tracker
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Funds</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track capital deposits across all accounts ·{" "}
            <span className="text-primary tabular">
              {summary.totalEntries} entries
            </span>
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
          {showForm ? "Cancel" : "Add Entry"}
        </Button>
      </div>

      {/* ── ADD FORM (toggleable) ── */}
      {showForm && (
        <AddFundForm
          onAdd={handleAdd}
          onClose={() => setShowForm(false)}
          isLoading={addFundMutation.isPending}
        />
      )}

      {/* ── KPI CARDS + ALLOCATION BAR ── */}
      <FundsStatsBar summary={summary} />

      {/* ── TABLE ── */}
      <FundsTable funds={funds} onDelete={handleDelete} />
    </div>
  );
}
