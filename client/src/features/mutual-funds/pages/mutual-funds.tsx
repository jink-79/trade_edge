import { X, PlusCircle, Wallet, Hash, BarChart2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutualFunds } from "../hooks/use-mutual-funds";
import { USE_MOCK } from "../api/mutual-funds-mock";
import { CATEGORIES, fmtINR, fmtINR2 } from "../utils/mutual-funds-utils";
import { StatCard } from "../components/stat-card";
import { AllocationBars } from "../components/allocation-bars";
import { PortfolioMixDonut } from "../components/portfolio-mix-donut";
import { AddEntryForm } from "../components/add-entry-form";
import { TransactionTable } from "../components/transaction-table";
import { MutualFundsSkeleton } from "@/components/page-skeletons";

export function MutualFundsPage() {
  const {
    summary,
    avgNav,
    showForm,
    setShowForm,
    search,
    setSearch,
    filterCat,
    setFilterCat,
    sortState,
    page,
    setPage,
    totalPages,
    paginatedEntries,
    filteredCount,
    handleSort,
    handleAddEntry,
    isLoading,
  } = useMutualFunds({ useMock: USE_MOCK });

  if (isLoading) {
    return <MutualFundsSkeleton />;
  }

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Portfolio · Mutual Funds
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
            Mutual Funds
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-foreground tabular">
              {summary.totalEntries}
            </span>{" "}
            transactions · total invested{" "}
            <span className="text-primary tabular">
              {fmtINR(summary.totalInvested)}
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

      {showForm && (
        <AddEntryForm
          onAdd={handleAddEntry}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={Wallet}
            label="Total Invested"
            value={`₹${(summary.totalInvested / 100000).toFixed(2)}L`}
            sub={fmtINR(summary.totalInvested)}
            accent
            iconColor="text-primary"
          />
          <StatCard
            icon={Hash}
            label="Total Units"
            value={summary.totalUnits.toFixed(2)}
            sub="units accumulated"
            iconColor="text-chart-2"
          />
          <StatCard
            icon={BarChart2}
            label="Avg NAV Paid"
            value={fmtINR2(avgNav)}
            sub="weighted avg cost"
            iconColor="text-chart-3"
          />
          <StatCard
            icon={Layers}
            label="Transactions"
            value={String(summary.totalEntries)}
            sub={`across ${CATEGORIES.length} categories`}
            iconColor="text-chart-5"
          />

          <AllocationBars summary={summary} />
        </div>

        <PortfolioMixDonut summary={summary} />
      </div>

      <TransactionTable
        paginatedEntries={paginatedEntries}
        filteredCount={filteredCount}
        search={search}
        setSearch={setSearch}
        filterCat={filterCat}
        setFilterCat={setFilterCat}
        sortState={sortState}
        onSort={handleSort}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />
    </div>
  );
}
