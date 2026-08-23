import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, PlusCircle, Scale, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

// hooks
import { useFunds, useAddFund, useDeleteFund, useFundsStatement } from "../hooks/use-funds";

// components
import { FundsStatsBar } from "../components/funds-stats-bar";
import { AddFundForm } from "../components/add-fund-form";
import { FundsStatementTable } from "../components/funds-statement-table";
import { FundsSkeleton } from "@/components/page-skeletons";

import type { AddFundPayload, FundsSummary, FundsStatementResponse } from "../types/funds.types";

const EMPTY_SUMMARY: FundsSummary = {
  totalFunds: 0,
  totalEntries: 0,
  byType: { trading: 0, savings: 0, emergency: 0, other: 0 },
  availableCash: 0,
};

const EMPTY_STATEMENT: FundsStatementResponse = {
  openingBalance: 0,
  closingBalance: 0,
  totalDeposits: 0,
  totalBuys: 0,
  totalSells: 0,
  totalRealizedPnl: 0,
  entries: [],
};

export function FundsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useFunds();
  const { data: statementData, isLoading: isStatementLoading } = useFundsStatement();
  const addFundMutation = useAddFund();
  const deleteFundMutation = useDeleteFund();

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const statement = statementData ?? EMPTY_STATEMENT;

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

  if (isLoading || isStatementLoading) {
    return <FundsSkeleton />;
  }

  return (
    <div className="px-8 py-8 space-y-6 max-w-[1600px]">
      {/* ── HERO ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Capital · Fund Statement
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Funds</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every deposit, buy and sell in one running ledger ·{" "}
            <span className="text-primary tabular">
              {statement.entries.length} entries
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
          {showForm ? "Cancel" : "Add Deposit"}
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

      {/* ── STATEMENT SUMMARY STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryTile
          icon={ArrowUpRight}
          iconColor="text-destructive"
          label="Total Bought"
          value={fmtINR(statement.totalBuys)}
          sub="capital committed"
        />
        <SummaryTile
          icon={ArrowDownLeft}
          iconColor="text-primary"
          label="Total Sold"
          value={fmtINR(statement.totalSells)}
          sub="net proceeds"
        />
        <SummaryTile
          icon={Scale}
          iconColor={statement.totalRealizedPnl >= 0 ? "text-primary" : "text-destructive"}
          label="Realized P&L"
          value={`${statement.totalRealizedPnl >= 0 ? "+" : "−"}${fmtINR(Math.abs(statement.totalRealizedPnl))}`}
          sub="all closed trades"
        />
        <SummaryTile
          icon={Scale}
          iconColor="text-muted-foreground"
          label="Closing Balance"
          value={fmtINR(statement.closingBalance)}
          sub="deposits + sells − buys"
        />
      </div>

      {/* ── STATEMENT ── */}
      <FundsStatementTable entries={statement.entries} onDeleteDeposit={handleDelete} />
    </div>
  );
}

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function SummaryTile({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] uppercase tracking-[0.16em]">
            {label}
          </CardDescription>
          <div
            className="size-7 rounded-md grid place-items-center ring-1 ring-border/70"
            style={{ background: "oklch(0.3 0.04 250)" }}
          >
            <Icon className={`size-3.5 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="text-2xl font-semibold tabular tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
