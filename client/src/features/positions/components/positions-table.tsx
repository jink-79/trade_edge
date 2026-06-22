import { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExpandedRow } from "./expanded-row";
import { fmtINR, SECTOR_COLOR } from "@/lib/positions-utils";
import type {
  EnrichedPosition,
  FilterKey,
  SortState,
} from "../types/positions.types";

/* ─── constants ─── */

const PAGE_SIZE = 8;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "signal", label: "⚠ Signals" },
  { key: "trail", label: "🔒 Trailing" },
  { key: "clean", label: "✓ Clean" },
];

/* ─── table primitives ─── */

function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left font-medium py-3 px-3 ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`py-3.5 px-3 ${className}`}>{children}</td>;
}

function SortIcon({ col, sortState }: { col: string; sortState: SortState }) {
  if (sortState.col !== col)
    return <ChevronsUpDown className="size-3 text-muted-foreground/40" />;
  return sortState.dir === "asc" ? (
    <ChevronUp className="size-3 text-primary" />
  ) : (
    <ChevronDown className="size-3 text-primary" />
  );
}

function SortBtn({
  col,
  label,
  sortState,
  onSort,
}: {
  col: SortState["col"];
  label: string;
  sortState: SortState;
  onSort: (col: SortState["col"]) => void;
}) {
  return (
    <button
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
    >
      {label}
      <SortIcon col={col} sortState={sortState} />
    </button>
  );
}

/* ─── main component ─── */

interface PositionsTableProps {
  positions: EnrichedPosition[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortState, setSortState] = useState<SortState>({
    col: "pnlPercent",
    dir: "desc",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const sort = (col: SortState["col"]) => {
    setSortState((prev: any) =>
      prev.col === col
        ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col, dir: "desc" },
    );
    setPage(1);
  };

  const toggleRow = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const filtered = useMemo(() => {
    let rows = positions;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.symbol.toLowerCase().includes(q) ||
          p.stockName.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q),
      );
    }
    if (filter === "signal") rows = rows.filter((p) => p.exitSignal);
    if (filter === "trail") rows = rows.filter((p) => p.trailingActive);
    if (filter === "clean")
      rows = rows.filter((p) => !p.exitSignal && !p.trailingActive);

    return [...rows].sort((a, b) => {
      const mul = sortState.dir === "asc" ? 1 : -1;
      return (
        ((a[sortState.col] as number) - (b[sortState.col] as number)) * mul
      );
    });
  }, [positions, search, filter, sortState]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-primary" /> All Positions
          </CardTitle>
          <CardDescription>Click any row to expand details</CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter pills */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1 border border-border/60">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search symbol or sector…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 w-52 text-sm bg-secondary/50 border-border/60"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border/60 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <Th className="pl-6 w-8" />
                <Th className="pl-3">Symbol</Th>
                <Th className="text-right">
                  <SortBtn
                    col="qty"
                    label="Qty"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th className="text-right">
                  <SortBtn
                    col="entryPrice"
                    label="Entry"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th className="text-right">
                  <SortBtn
                    col="currentPrice"
                    label="LTP"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th className="text-right">
                  <SortBtn
                    col="pnlAbs"
                    label="P&L (₹)"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th className="text-right">
                  <SortBtn
                    col="pnlPercent"
                    label="P&L %"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th className="text-right pr-6">Status</Th>
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground text-sm border-t border-border/60"
                  >
                    No positions match your filters.
                  </td>
                </tr>
              )}

              {paginated.map((pos) => {
                const isExpanded = expandedId === pos._id;
                const pnlPos = pos.pnlPercent >= 0;

                return (
                  <>
                    <tr
                      key={pos._id}
                      onClick={() => toggleRow(pos._id)}
                      className={`border-t border-border/60 cursor-pointer transition-colors ${
                        isExpanded
                          ? "bg-[oklch(0.22_0.015_252)]"
                          : "hover:bg-accent/20"
                      }`}
                    >
                      {/* chevron */}
                      <Td className="pl-6 w-8">
                        <div className="size-5 rounded grid place-items-center text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="size-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </div>
                      </Td>

                      {/* symbol */}
                      <Td className="pl-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-8 rounded-lg grid place-items-center text-[10px] font-bold ring-1 ring-border/70 shrink-0"
                            style={{ background: "oklch(0.26 0.015 252)" }}
                          >
                            {pos.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium leading-tight">
                              {pos.symbol}
                            </div>
                            <div className="text-[11px] text-muted-foreground leading-tight max-w-35 truncate">
                              {pos.stockName}
                            </div>
                          </div>
                        </div>
                      </Td>

                      {/* qty */}
                      <Td className="text-right tabular">{pos.qty}</Td>

                      {/* entry */}
                      <Td className="text-right tabular">
                        {fmtINR(pos.entryPrice)}
                      </Td>

                      {/* ltp */}
                      <Td className="text-right tabular">
                        <span
                          className={
                            pnlPos ? "text-primary" : "text-destructive"
                          }
                        >
                          {fmtINR(pos.currentPrice)}
                        </span>
                      </Td>

                      {/* pnl abs */}
                      <Td
                        className={`text-right tabular font-medium ${pnlPos ? "text-primary" : "text-destructive"}`}
                      >
                        {pnlPos ? "+" : ""}
                        {fmtINR(pos.pnlAbs)}
                      </Td>

                      {/* pnl % + mini bar */}
                      <Td className="text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pnlPos ? "bg-primary" : "bg-destructive"}`}
                              style={{
                                width: `${Math.min(100, Math.abs(pos.pnlPercent) * 10)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`tabular text-xs font-medium min-w-14 text-right inline-flex items-center justify-end gap-0.5 rounded-md px-1.5 py-0.5 ${
                              pnlPos
                                ? "text-primary bg-primary/10"
                                : "text-destructive bg-destructive/10"
                            }`}
                          >
                            {pnlPos ? (
                              <ArrowUpRight className="size-3" />
                            ) : (
                              <ArrowDownRight className="size-3" />
                            )}
                            {Math.abs(pos.pnlPercent).toFixed(2)}%
                          </span>
                        </div>
                      </Td>

                      {/* status */}
                      <Td className="pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {pos.exitSignal && (
                            <Badge className="text-[10px] bg-destructive/15 text-destructive border border-destructive/30 gap-1">
                              <AlertTriangle className="size-2.5" /> Exit
                            </Badge>
                          )}
                          {pos.trailingActive && (
                            <Badge className="text-[10px] bg-primary/15 text-primary border border-primary/30 gap-1">
                              <Shield className="size-2.5" /> Trail
                            </Badge>
                          )}
                          {!pos.exitSignal && !pos.trailingActive && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] border-border/60 ${SECTOR_COLOR[pos.sector] ?? "text-muted-foreground"}`}
                            >
                              {pos.sector}
                            </Badge>
                          )}
                        </div>
                      </Td>
                    </tr>

                    {isExpanded && (
                      <ExpandedRow key={`${pos._id}-exp`} pos={pos} />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
            positions
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 border-border/70 text-xs"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className={`h-7 w-7 p-0 text-xs ${p === page ? "" : "border-border/70"}`}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 border-border/70 text-xs"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
