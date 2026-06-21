import { useState, useMemo } from "react";
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Fund, FundType, SortState } from "../types/funds.types";

/* ─── constants ─── */

const TYPE_CFG: Record<FundType, { label: string; badge: string }> = {
  trading: {
    label: "Trading",
    badge: "text-primary bg-primary/10 border-primary/30",
  },
  savings: {
    label: "Savings",
    badge:
      "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.1)] border-[oklch(0.68_0.18_240/0.3)]",
  },
  emergency: {
    label: "Emergency",
    badge:
      "text-[oklch(0.82_0.16_85)] bg-[oklch(0.82_0.16_85/0.1)] border-[oklch(0.82_0.16_85/0.3)]",
  },
  other: {
    label: "Other",
    badge: "text-muted-foreground bg-muted/30 border-border/60",
  },
};

const FUND_TYPES: Array<FundType | "all"> = [
  "all",
  "trading",
  "savings",
  "emergency",
  "other",
];
const PAGE_SIZE = 10;

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

/* ─── sub-components ─── */

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
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
    >
      {label}
      <SortIcon col={col} sortState={sortState} />
    </button>
  );
}

/* ─── main table ─── */

interface FundsTableProps {
  funds: Fund[];
  onDelete?: (id: string) => void;
}

export function FundsTable({ funds, onDelete }: FundsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FundType | "all">("all");
  const [sortState, setSortState] = useState<SortState>({
    col: "date",
    dir: "desc",
  });
  const [page, setPage] = useState(1);

  const sort = (col: SortState["col"]) => {
    setSortState((prev) => ({
      col,
      dir: prev.col === col && prev.dir === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  };

  const filtered = useMemo(() => {
    let rows = funds;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.notes ?? "").toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "all") rows = rows.filter((f) => f.type === typeFilter);

    return [...rows].sort((a, b) => {
      const mul = sortState.dir === "asc" ? 1 : -1;
      if (sortState.col === "date" || sortState.col === "createdAt") {
        return (
          (new Date(a[sortState.col]).getTime() -
            new Date(b[sortState.col]).getTime()) *
          mul
        );
      }
      if (sortState.col === "name" || sortState.col === "type") {
        return (
          (a[sortState.col] as string).localeCompare(
            b[sortState.col] as string,
          ) * mul
        );
      }
      return (
        ((a[sortState.col] as number) - (b[sortState.col] as number)) * mul
      );
    });
  }, [funds, search, typeFilter, sortState]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* running total for the filtered+sorted view */
  const filteredTotal = filtered.reduce((s, f) => s + f.amount, 0);

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Fund Records
          </CardTitle>
          <CardDescription>
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} · total{" "}
            <span className="text-primary tabular">
              {fmtINR(filteredTotal)}
            </span>
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter pills */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1 border border-border/60">
            {FUND_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name or notes…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 w-44 text-sm bg-secondary/50 border-border/60"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border/60 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <Th className="pl-6">
                  <SortBtn
                    col="date"
                    label="Date"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th>
                  <SortBtn
                    col="name"
                    label="Account"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th>
                  <SortBtn
                    col="type"
                    label="Type"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                <Th className="max-w-50">Notes</Th>
                <Th className="text-right pr-6">
                  <SortBtn
                    col="amount"
                    label="Amount (₹)"
                    sortState={sortState}
                    onSort={sort}
                  />
                </Th>
                {onDelete && <Th className="w-10" />}
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground text-sm border-t border-border/60"
                  >
                    No fund entries match your filters.
                  </td>
                </tr>
              )}
              {paginated.map((fund) => {
                const cfg = TYPE_CFG[fund.type];
                return (
                  <tr
                    key={fund._id}
                    className="border-t border-border/60 hover:bg-accent/20 transition-colors"
                  >
                    {/* Date */}
                    <Td className="pl-6 tabular text-muted-foreground">
                      {fmtDate(fund.date)}
                    </Td>

                    {/* Account name */}
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-7 rounded-md grid place-items-center text-[10px] font-bold ring-1 ring-border/70 shrink-0"
                          style={{ background: "oklch(0.26 0.015 252)" }}
                        >
                          {fund.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{fund.name}</span>
                      </div>
                    </Td>

                    {/* Type badge */}
                    <Td>
                      <Badge
                        variant="outline"
                        className={`text-[10px] border ${cfg.badge}`}
                      >
                        {cfg.label}
                      </Badge>
                    </Td>

                    {/* Notes */}
                    <Td className="text-muted-foreground text-xs max-w-50 truncate">
                      {fund.notes || <span className="opacity-40">—</span>}
                    </Td>

                    {/* Amount */}
                    <Td className="text-right pr-6 tabular font-medium text-primary">
                      {fmtINR(fund.amount)}
                    </Td>

                    {/* Delete */}
                    {onDelete && (
                      <Td className="pr-4">
                        <button
                          onClick={() => onDelete(fund._id)}
                          className="size-7 rounded-md grid place-items-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
              entries
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
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                    acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`e-${i}`}
                      className="text-xs text-muted-foreground px-1"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className={`h-7 w-7 p-0 text-xs ${p === page ? "" : "border-border/70"}`}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </Button>
                  ),
                )}
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
        )}
      </CardContent>
    </Card>
  );
}
