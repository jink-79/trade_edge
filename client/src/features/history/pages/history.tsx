import {
  Activity,
  Calendar,
  Download,
  TrendingUp,
  Target,
  Layers,
  Clock,
  Flame,
  Skull,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useHistory } from "../hooks/use-history";
import { USE_MOCK } from "../api/history-mock";
import { fmtINR } from "../utils/history-utils";
import { HistoryStatCard } from "../components/history-stat-card";
import { TradeHistoryTable } from "../components/trade-history-table";

export function HistoryPage() {
  const {
    search,
    setSearch,
    filter,
    setFilter,
    sortState,
    expandedId,
    page,
    setPage,
    kpis,
    totalCount,
    paginatedTrades,
    totalPages,
    handleSort,
    toggleRow,
    isLoading,
  } = useHistory({ useMock: USE_MOCK });

  if (isLoading || !kpis) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading Trade History...
      </div>
    );
  }

  return (
    <div>
      <div className="px-8 py-8 space-y-8 max-w-[1600px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Activity className="h-3 w-3" /> Closed · {totalCount} trades
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Realised{" "}
              <span
                className={cn(
                  "font-mono font-semibold tabular-nums",
                  kpis.totalPnl >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {kpis.totalPnl >= 0 ? "+" : ""}
                {fmtINR(kpis.totalPnl)}
              </span>{" "}
              over {totalCount} closed trades ·{" "}
              <span
                className={cn(
                  "font-mono tabular-nums",
                  kpis.totalPnl >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {kpis.totalPnl >= 0 ? "+" : ""}
                {kpis.totalPnlPct.toFixed(2)}%
              </span>{" "}
              on deployed capital
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-3.5 w-3.5" /> Last 90 days
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <HistoryStatCard
            icon={TrendingUp}
            label="Realised P&L"
            value={`${kpis.totalPnl >= 0 ? "+" : "-"}${fmtINR(Math.abs(kpis.totalPnl))}`}
            sub={`${kpis.totalPnlPct >= 0 ? "+" : ""}${kpis.totalPnlPct.toFixed(2)}% on deployed`}
            accent
            valueTone={kpis.totalPnl >= 0 ? "pos" : "neg"}
            iconColor="text-primary"
          />
          <HistoryStatCard
            icon={Target}
            label="Win Rate"
            value={`${kpis.winRate.toFixed(0)}%`}
            sub={`${kpis.winsCount}W · ${kpis.lossesCount}L`}
            iconColor="text-success"
          />
          <HistoryStatCard
            icon={Layers}
            label="Expectancy"
            value={`${kpis.expectancy >= 0 ? "+" : ""}${kpis.expectancy.toFixed(2)}%`}
            sub="per trade, avg"
            valueTone={kpis.expectancy >= 0 ? "pos" : "neg"}
            iconColor="text-primary"
          />
          <HistoryStatCard
            icon={Clock}
            label="Avg Holding"
            value={`${kpis.avgHold}d`}
            sub="entry → exit"
            iconColor="text-muted-foreground"
          />
          <HistoryStatCard
            icon={Flame}
            label="Best Trade"
            value={`+${kpis.best.pnlPercent.toFixed(1)}%`}
            sub={`${kpis.best.symbol} · ${fmtINR(kpis.best.pnlAbs)}`}
            valueTone="pos"
            iconColor="text-success"
          />
          <HistoryStatCard
            icon={Skull}
            label="Worst Trade"
            value={`${kpis.worst.pnlPercent.toFixed(1)}%`}
            sub={`${kpis.worst.symbol} · ${fmtINR(kpis.worst.pnlAbs)}`}
            valueTone="neg"
            iconColor="text-destructive"
          />
        </section>

        <TradeHistoryTable
          paginatedTrades={paginatedTrades}
          filteredCount={totalCount}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          sortState={sortState}
          onSort={handleSort}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          expandedId={expandedId}
          onToggleRow={toggleRow}
        />
      </div>
    </div>
  );
}
