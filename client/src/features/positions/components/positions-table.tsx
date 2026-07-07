import { useState, useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { ExitDialog } from "./exit-dialog";
import { fmtINR } from "@/lib/positions-utils";
import type {
  EnrichedPosition,
  FilterKey,
  SortCol,
  SortState,
} from "../types/positions.types";

const PAGE_SIZE = 8;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "long", label: "Long" },
  { key: "short", label: "Short" },
];

function StatusPill({ pos }: { pos: EnrichedPosition }) {
  let label = "Active";
  let cls = "bg-muted/40 text-muted-foreground border-border/60";
  if (pos.exitSignal) {
    label = "Exit Signal";
    cls = "bg-destructive/10 text-destructive border-destructive/30";
  } else if (pos.trailingActive) {
    label = "Trailing";
    cls = "bg-primary/10 text-primary border-primary/30";
  }
  return (
    <Badge className={cn("border h-5 px-2 text-[10px] font-medium", cls)}>
      {label}
    </Badge>
  );
}

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
  return <td className={`py-4 px-3 ${className}`}>{children}</td>;
}

function SortIcon({ col, sortState }: { col: SortCol; sortState: SortState }) {
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
  col: SortCol;
  label: string;
  sortState: SortState;
  onSort: (col: SortCol) => void;
}) {
  return (
    <button
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
    >
      {label}
      <SortIcon col={col} sortState={sortState} />
    </button>
  );
}

interface PositionsTableProps {
  positions: EnrichedPosition[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortState, setSortState] = useState<SortState>({
    col: "tradeDate",
    dir: "desc",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exitPos, setExitPos] = useState<EnrichedPosition | null>(null);
  const [page, setPage] = useState(1);

  const sort = (col: SortCol) => {
    setSortState((prev) =>
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
          p.stockSymbol.toLowerCase().includes(q) ||
          p.stockName.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q),
      );
    }
    if (filter !== "all") rows = rows.filter((p) => p.side === filter);

    return [...rows].sort((a, b) => {
      const mul = sortState.dir === "asc" ? 1 : -1;
      if (sortState.col === "tradeDate") {
        return (
          (new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()) *
          mul
        );
      }
      return ((a[sortState.col] as number) - (b[sortState.col] as number)) * mul;
    });
  }, [positions, search, filter, sortState]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
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
          <CardDescription>
            Click any row to expand details · LTP &amp; P&amp;L sync weekly
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
                <Th className="pl-6">Symbol</Th>
                <Th className="text-right">
                  <SortBtn
                    col="quantity"
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
                <Th className="text-right">LTP</Th>
                <Th className="text-right">P&amp;L</Th>
                <Th className="text-right">P&amp;L %</Th>
                <Th>Status</Th>
                <Th className="text-right pr-6">Actions</Th>
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
                const open = expandedId === pos._id;
                const isLong = pos.side === "long";
                const positive = (pos.pnlPct ?? 0) >= 0;

                return (
                  <>
                    <tr
                      key={pos._id}
                      onClick={() => toggleRow(pos._id)}
                      className={cn(
                        "cursor-pointer border-t border-border/60 transition-colors",
                        open
                          ? "bg-accent/40 hover:bg-accent/40"
                          : "hover:bg-accent/20",
                      )}
                    >
                      {/* Symbol */}
                      <Td className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg grid place-items-center text-[11px] font-semibold tabular tracking-wide bg-primary/15 text-primary ring-1 ring-primary/30">
                            {pos.stockSymbol.slice(0, 2)}
                          </div>
                          <div className="leading-tight">
                            <div className="font-medium tracking-wide tabular flex items-center gap-2">
                              {pos.stockSymbol}
                              <Badge
                                className={cn(
                                  "border h-4 px-1.5 text-[10px] font-medium",
                                  isLong
                                    ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/10"
                                    : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10",
                                )}
                              >
                                {isLong ? "LONG" : "SHORT"}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground max-w-40 truncate">
                              {pos.stockName}
                            </div>
                          </div>
                        </div>
                      </Td>

                      {/* Qty */}
                      <Td className="text-right tabular">{pos.quantity}</Td>

                      {/* Entry */}
                      <Td className="text-right tabular text-muted-foreground">
                        {fmtINR(pos.entryPrice)}
                      </Td>

                      {/* LTP */}
                      <Td className="text-right tabular font-medium">
                        {pos.currentPrice != null ? (
                          fmtINR(pos.currentPrice)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Td>

                      {/* P&L ₹ */}
                      <Td
                        className={cn(
                          "text-right tabular font-medium",
                          positive ? "text-primary" : "text-destructive",
                        )}
                      >
                        {pos.pnlAbs != null ? (
                          <>
                            {positive ? "+" : "−"}
                            {fmtINR(Math.abs(pos.pnlAbs))}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Td>

                      {/* P&L % */}
                      <Td
                        className={cn(
                          "text-right tabular",
                          positive ? "text-primary" : "text-destructive",
                        )}
                      >
                        {pos.pnlPct != null ? (
                          <span className="inline-flex items-center justify-end gap-0.5">
                            {positive ? (
                              <ArrowUpRight className="size-3.5" />
                            ) : (
                              <ArrowDownRight className="size-3.5" />
                            )}
                            {Math.abs(pos.pnlPct).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Td>

                      {/* Status */}
                      <Td>
                        <StatusPill pos={pos} />
                      </Td>

                      {/* Actions */}
                      <Td className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExitPos(pos);
                            }}
                          >
                            <LogOut className="size-3.5" /> Exit
                          </Button>
                          <ChevronDown
                            className={cn(
                              "size-4 text-muted-foreground transition-transform",
                              open && "rotate-180",
                            )}
                          />
                        </div>
                      </Td>
                    </tr>

                    {open && <ExpandedRow key={`${pos._id}-exp`} pos={pos} />}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
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

      <ExitDialog position={exitPos} onClose={() => setExitPos(null)} />
    </Card>
  );
}
