import { TrendingUp, Search } from "lucide-react";
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
import {
  type MutualFundEntry,
  type SortState,
} from "../types/mutual-funds.types";
import {
  CATEGORIES,
  CAT_TOKENS,
  fmtDate,
  fmtINR,
  fmtINR2,
  PAGE_SIZE,
} from "../utils/mutual-funds-utils";
import { SortBtn } from "./sort-btn";

interface TransactionTableProps {
  paginatedEntries: MutualFundEntry[];
  filteredCount: number;
  search: string;
  setSearch: (val: string) => void;
  filterCat: string;
  setFilterCat: (val: string) => void;
  sortState: SortState;
  onSort: (col: string) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

export function TransactionTable({
  paginatedEntries,
  filteredCount,
  search,
  setSearch,
  filterCat,
  setFilterCat,
  sortState,
  onSort,
  page,
  setPage,
  totalPages,
}: TransactionTableProps) {
  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const pageButtons = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Transaction History
          </CardTitle>
          <CardDescription>
            {filteredCount} entries · sorted by {sortState.col} ({sortState.dir}
            )
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1 border border-border/60">
            <button
              onClick={() => {
                setFilterCat("all");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterCat === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilterCat(cat);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filterCat === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search fund name…"
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
                <th className="text-left font-medium py-3 px-3 pl-6">
                  <SortBtn
                    col="date"
                    label="Date"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left font-medium py-3 px-3">
                  <SortBtn
                    col="fundName"
                    label="Fund Name"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left font-medium py-3 px-3">Category</th>
                <th className="font-medium py-3 px-3 text-right">
                  <SortBtn
                    col="nav"
                    label="NAV (₹)"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
                <th className="font-medium py-3 px-3 text-right">
                  <SortBtn
                    col="units"
                    label="Units"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
                <th className="font-medium py-3 px-3 text-right pr-6">
                  <SortBtn
                    col="amount"
                    label="Amount (₹)"
                    sortState={sortState}
                    onSort={onSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground text-sm border-t border-border/60"
                  >
                    No entries match your filters.
                  </td>
                </tr>
              )}
              {paginatedEntries.map((entry) => (
                <tr
                  key={entry._id}
                  className="border-t border-border/60 hover:bg-accent/20 transition-colors"
                >
                  <td className="py-3.5 px-3 pl-6 tabular text-muted-foreground">
                    {fmtDate(entry.date)}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="size-7 rounded-md grid place-items-center text-[9px] font-bold ring-1 ring-border/70 shrink-0"
                        style={{ background: "oklch(0.26 0.015 252)" }}
                      >
                        {entry.fundName.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className="font-medium max-w-70 truncate"
                        title={entry.fundName}
                      >
                        {entry.fundName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium tracking-wide border ${CAT_TOKENS[entry.category]?.color ?? ""}`}
                    >
                      {entry.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3 text-right tabular">
                    {fmtINR2(entry.nav)}
                  </td>
                  <td className="py-3.5 px-3 text-right tabular text-muted-foreground">
                    {entry.units.toFixed(3)}
                  </td>
                  <td className="py-3.5 px-3 text-right pr-6 tabular font-medium text-primary">
                    {fmtINR(entry.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Showing {filteredCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filteredCount)} of {filteredCount}{" "}
            entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 border-border/70 text-xs"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ← Prev
            </Button>
            {pageButtons.map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
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
                  onClick={() => handlePageChange(p as number)}
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
              onClick={() => handlePageChange(page + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
