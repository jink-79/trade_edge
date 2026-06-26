import { Fragment } from "react";
import {
  ChevronUp,
  ChevronDown,
  Hash,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  type EnrichedTrade,
  type FilterKey,
  type SortCol,
  type SortState,
} from "../types/history.types";
import {
  sectorColors,
  exitStyles,
  fmtINR,
  fmtDate,
  PAGE_SIZE,
} from "../utils/history-utils";
import { HistorySortBtn } from "./history-sort-btn";
import { HistoryRowDetails } from "./history-row-details";

interface TradeHistoryTableProps {
  paginatedTrades: EnrichedTrade[];
  filteredCount: number;
  search: string;
  setSearch: (val: string) => void;
  filter: FilterKey;
  setFilter: (val: FilterKey) => void;
  sortState: SortState;
  onSort: (col: SortCol) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  expandedId: string | null;
  onToggleRow: (id: string) => void;
}

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "wins", label: "✓ Wins" },
  { key: "losses", label: "✕ Losses" },
  { key: "target", label: "🎯 Target" },
  { key: "stop", label: "🛑 Stop" },
];

export function TradeHistoryTable({
  paginatedTrades,
  filteredCount,
  search,
  setSearch,
  filter,
  setFilter,
  sortState,
  onSort,
  page,
  setPage,
  totalPages,
  expandedId,
  onToggleRow,
}: TradeHistoryTableProps) {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4 text-muted-foreground" /> Closed Trades
            </CardTitle>
            <CardDescription className="text-xs">
              Click any row to expand trade details
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/30 p-1">
              {filterOptions.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setFilter(f.key);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded px-3 py-1 text-xs font-medium transition-all",
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search symbol, sector…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-56 border-border/60 bg-secondary/50 pl-8 text-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-background/40">
              <tr className="border-b border-border/60">
                <th className="w-8 px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground" />
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Symbol
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Qty
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Entry
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Exit
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <HistorySortBtn
                    col="pnlAbs"
                    label="P&L"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <HistorySortBtn
                    col="pnlPercent"
                    label="P&L %"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <HistorySortBtn
                    col="holdingDays"
                    label="Held"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <HistorySortBtn
                    col="exitDate"
                    label="Exit Reason"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center text-sm text-muted-foreground"
                  >
                    No closed trades match your filters.
                  </td>
                </tr>
              )}
              {paginatedTrades.map((t) => {
                const isExpanded = expandedId === t._id;
                const isPnlPositive = t.pnlAbs >= 0;
                return (
                  <Fragment key={t._id}>
                    <tr
                      onClick={() => onToggleRow(t._id)}
                      className={cn(
                        "cursor-pointer border-t border-border/60 transition-colors",
                        isExpanded
                          ? "bg-[oklch(0.22_0.015_252)]"
                          : "hover:bg-accent/20",
                      )}
                    >
                      <td className="px-4 py-4 align-middle">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-md border font-mono text-[10px] font-semibold",
                              sectorColors[t.sector] ??
                                "border-border bg-secondary text-muted-foreground",
                            )}
                          >
                            {t.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold tracking-tight">
                              {t.symbol}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {t.stockName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle text-right font-mono tabular-nums">
                        {t.qty}
                      </td>
                      <td className="px-4 py-4 align-middle text-right font-mono tabular-nums text-muted-foreground">
                        {fmtINR(t.entryPrice)}
                      </td>
                      <td className="px-4 py-4 align-middle text-right font-mono font-medium tabular-nums">
                        {fmtINR(t.exitPrice)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-4 align-middle text-right font-mono font-semibold tabular-nums",
                          isPnlPositive ? "text-success" : "text-destructive",
                        )}
                      >
                        {isPnlPositive ? "+" : ""}
                        {fmtINR(t.pnlAbs)}
                      </td>
                      <td className="px-4 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-secondary md:block">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                isPnlPositive ? "bg-success" : "bg-destructive",
                              )}
                              style={{
                                width: `${Math.min(100, Math.abs(t.pnlPercent) * 4)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-mono tabular-nums",
                              isPnlPositive
                                ? "text-success"
                                : "text-destructive",
                            )}
                          >
                            {isPnlPositive ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(t.pnlPercent).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle text-right font-mono tabular-nums text-muted-foreground">
                        {t.holdingDays}d
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                            exitStyles[t.exitReason],
                          )}
                        >
                          {t.exitReason}
                        </span>
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {fmtDate(t.exitDate)}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <HistoryRowDetails trade={t} />}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-start gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            {filteredCount === 0
              ? 0
              : Math.min((page - 1) * PAGE_SIZE + 1, filteredCount)}{" "}
            –{Math.min(page * PAGE_SIZE, filteredCount)} of {filteredCount}{" "}
            trades
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs"
            >
              ← Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "h-7 min-w-7 rounded px-2 font-mono text-xs transition-colors",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs"
            >
              Next →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
