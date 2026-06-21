import { useState } from "react";
import { PlusCircle, X,  } from "lucide-react";
import { Button } from "@/components/ui/button";

// hooks
import { useAddFund, useDeleteFund } from "../hooks/use-funds";

// components
import { FundsStatsBar } from "../components/funds-stats-bar";
import { AddFundForm } from "../components/add-fund-form";
import { FundsTable } from "../components/funds-table";

// mock (remove once API is live)
import { MOCK_FUNDS_RESPONSE } from "../api/funds-mock";
import type { AddFundPayload, Fund } from "../types/funds.types";

/* ── flip to false once the backend is live ── */
const USE_MOCK = true;

export function FundsPage() {
  const [showForm, setShowForm] = useState(false);

  /* local state for mock mode — replace with query data when live */
  const [mockFunds, setMockFunds] = useState(MOCK_FUNDS_RESPONSE.data);

  const addFundMutation = useAddFund();
  const deleteFundMutation = useDeleteFund();

  /* derive summary from local state in mock mode */
  const summary = USE_MOCK
    ? (() => {
        const byType = { trading: 0, savings: 0, emergency: 0, other: 0 };
        mockFunds.forEach((f) => {
          byType[f.type] = (byType[f.type] ?? 0) + f.amount;
        });
        return {
          totalFunds: mockFunds.reduce((s, f) => s + f.amount, 0),
          totalEntries: mockFunds.length,
          byType,
        };
      })()
    : MOCK_FUNDS_RESPONSE.summary; // replaced by real query in live mode

  const funds = USE_MOCK ? mockFunds : MOCK_FUNDS_RESPONSE.data;

  /* handlers */
  const handleAdd = (payload: AddFundPayload) => {
    if (USE_MOCK) {
      const newFund: Fund = {
        _id: Math.random().toString(36).slice(2),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setMockFunds((prev) => [newFund, ...prev]);
      setShowForm(false);
      return;
    }
    addFundMutation.mutate(payload, { onSuccess: () => setShowForm(false) });
  };

  const handleDelete = (id: string) => {
    if (USE_MOCK) {
      setMockFunds((prev) => prev.filter((f) => f._id !== id));
      return;
    }
    deleteFundMutation.mutate(id);
  };

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
