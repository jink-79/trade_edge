import { useState, useMemo } from "react";
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  Flame,
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
import type { Signal, SortState } from "../types/signals.types";
// import type  Signal, SortState

/* ─── constants ─── */

const STRENGTH_CFG = {
  strong: {
    label: "Strong",
    dot: "bg-primary",
    text: "text-primary",
    badge: "text-primary bg-primary/10 border-primary/30",
  },
  moderate: {
    label: "Moderate",
    dot: "bg-[oklch(0.82_0.16_85)]",
    text: "text-[oklch(0.82_0.16_85)]",
    badge:
      "text-[oklch(0.82_0.16_85)] bg-[oklch(0.82_0.16_85/0.10)] border-[oklch(0.82_0.16_85/0.3)]",
  },
  weak: {
    label: "Weak",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    badge: "text-muted-foreground bg-muted/30 border-border/60",
  },
};

const SECTOR_COLORS: Record<string, string> = {
  IT: "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.1)] border-[oklch(0.68_0.18_240/0.3)]",
  Electronics:
    "text-[oklch(0.82_0.16_85)]  bg-[oklch(0.82_0.16_85/0.1)]  border-[oklch(0.82_0.16_85/0.3)]",
  Defence: "text-primary bg-primary/10 border-primary/30",
  Consumer:
    "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.1)] border-[oklch(0.74_0.15_300/0.3)]",
  Auto: "text-[oklch(0.68_0.21_22)]  bg-[oklch(0.68_0.21_22/0.1)]  border-[oklch(0.68_0.21_22/0.3)]",
  Chemicals:
    "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.1)] border-[oklch(0.74_0.15_300/0.3)]",
  Technology:
    "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.1)] border-[oklch(0.68_0.18_240/0.3)]",
  Materials:
    "text-[oklch(0.82_0.16_85)]  bg-[oklch(0.82_0.16_85/0.1)]  border-[oklch(0.82_0.16_85/0.3)]",
  Finance: "text-primary bg-primary/10 border-primary/30",
  FMCG: "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.1)] border-[oklch(0.74_0.15_300/0.3)]",
};

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

/* ─── sort icon ─── */

function SortIcon({ col, sortState }: { col: string; sortState: SortState }) {
  if (sortState.col !== col)
    return <ChevronsUpDown className="size-3 text-muted-foreground/40" />;
  return sortState.dir === "asc" ? (
    <ChevronUp className="size-3 text-primary" />
  ) : (
    <ChevronDown className="size-3 text-primary" />
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
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

/* ─── volume bar ─── */

function VolumeBar({ ratio }: { ratio: number }) {
  // Cap visual at 3x for the bar, show real number
  const pct = Math.min(100, ((ratio - 1) / 2) * 100);
  const color =
    ratio >= 2.0
      ? "bg-primary"
      : ratio >= 1.5
        ? "bg-[oklch(0.82_0.16_85)]"
        : "bg-muted-foreground/50";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-secondary/60 overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`tabular text-xs font-medium ${
          ratio >= 2.0
            ? "text-primary"
            : ratio >= 1.5
              ? "text-[oklch(0.82_0.16_85)]"
              : "text-muted-foreground"
        }`}
      >
        {ratio.toFixed(2)}x
      </span>
    </div>
  );
}

/* ─── risk/reward pill ─── */

function RRPill({ signal }: { signal: Signal }) {
  const risk = signal.entryPrice - signal.stopLoss;
  const reward = signal.targetPrice - signal.entryPrice;
  const rr = risk > 0 ? (reward / risk).toFixed(2) : "—";
  return (
    <span className="tabular text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
      {rr}R
    </span>
  );
}

/* ─── main table ─── */

interface SignalTableProps {
  signals: Signal[];
}

const STRENGTH_FILTERS = ["all", "strong", "moderate", "weak"] as const;
const PAGE_SIZE = 10;

export function SignalTable({ signals }: SignalTableProps) {
  const [search, setSearch] = useState("");
  const [strength, setStrength] =
    useState<(typeof STRENGTH_FILTERS)[number]>("all");
  const [sortState, setSortState] = useState<SortState>({
    col: "volumeRatio",
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
    let rows = signals;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.stockName.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q),
      );
    }
    if (strength !== "all") rows = rows.filter((s) => s.strength === strength);

    return [...rows].sort((a, b) => {
      const mul = sortState.dir === "asc" ? 1 : -1;
      if (sortState.col === "riskReward") {
        const rrA =
          (a.targetPrice - a.entryPrice) / (a.entryPrice - a.stopLoss);
        const rrB =
          (b.targetPrice - b.entryPrice) / (b.entryPrice - b.stopLoss);
        return (rrA - rrB) * mul;
      }
      const va = (a as any)[sortState.col];
      const vb = (b as any)[sortState.col];
      if (typeof va === "string") return va.localeCompare(vb) * mul;
      return (va - vb) * mul;
    });
  }, [signals, search, strength, sortState]);

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
            <Flame className="size-4 text-primary" /> Signal Feed
          </CardTitle>
          <CardDescription>
            {filtered.length} signal{filtered.length !== 1 ? "s" : ""} · sorted
            by {sortState.col} ({sortState.dir})
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Strength filter pills */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1 border border-border/60">
            {STRENGTH_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setStrength(f);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                  strength === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Symbol or sector…"
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
                  <button
                    onClick={() => sort("symbol")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    Symbol <SortIcon col="symbol" sortState={sortState} />
                  </button>
                </Th>
                <Th>Sector</Th>
                <Th className="text-right">
                  <button
                    onClick={() => sort("entryPrice")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    Entry <SortIcon col="entryPrice" sortState={sortState} />
                  </button>
                </Th>
                <Th className="text-right">
                  <button
                    onClick={() => sort("stopLoss")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    Stop <SortIcon col="stopLoss" sortState={sortState} />
                  </button>
                </Th>
                <Th className="text-right">
                  <button
                    onClick={() => sort("targetPrice")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    Target <SortIcon col="targetPrice" sortState={sortState} />
                  </button>
                </Th>
                <Th className="text-right">
                  <button
                    onClick={() => sort("riskReward")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    R:R <SortIcon col="riskReward" sortState={sortState} />
                  </button>
                </Th>
                <Th>
                  <button
                    onClick={() => sort("volumeRatio")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    Volume <SortIcon col="volumeRatio" sortState={sortState} />
                  </button>
                </Th>
                <Th className="text-right pr-6">
                  <button
                    onClick={() => sort("strength")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    Strength <SortIcon col="strength" sortState={sortState} />
                  </button>
                </Th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground text-sm border-t border-border/60"
                  >
                    No signals match your filters.
                  </td>
                </tr>
              )}
              {paginated.map((signal) => {
                const cfg = STRENGTH_CFG[signal.strength];
                const sectorColor =
                  SECTOR_COLORS[signal.sector] ??
                  "text-muted-foreground border-border/60";
                const riskPct = (
                  ((signal.entryPrice - signal.stopLoss) / signal.entryPrice) *
                  100
                ).toFixed(1);

                return (
                  <tr
                    key={signal._id}
                    className="border-t border-border/60 hover:bg-accent/20 transition-colors"
                  >
                    {/* Symbol */}
                    <Td className="pl-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-8 rounded-lg grid place-items-center text-[10px] font-bold ring-1 ring-border/70 shrink-0"
                          style={{ background: "oklch(0.26 0.015 252)" }}
                        >
                          {signal.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium leading-tight">
                            {signal.symbol}
                          </div>
                          <div className="text-[11px] text-muted-foreground leading-tight max-w-40 truncate">
                            {signal.stockName}
                          </div>
                        </div>
                      </div>
                    </Td>

                    {/* Sector */}
                    <Td>
                      <Badge
                        variant="outline"
                        className={`text-[10px] border ${sectorColor}`}
                      >
                        {signal.sector}
                      </Badge>
                    </Td>

                    {/* Entry */}
                    <Td className="text-right tabular font-medium">
                      ₹{fmtINR(signal.entryPrice)}
                    </Td>

                    {/* Stop */}
                    <Td className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="tabular text-destructive font-medium text-xs">
                          ₹{fmtINR(signal.stopLoss)}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular">
                          -{riskPct}%
                        </span>
                      </div>
                    </Td>

                    {/* Target */}
                    <Td className="text-right tabular text-primary font-medium text-xs">
                      ₹{fmtINR(signal.targetPrice)}
                    </Td>

                    {/* R:R */}
                    <Td className="text-right pr-2">
                      <div className="flex justify-end">
                        <RRPill signal={signal} />
                      </div>
                    </Td>

                    {/* Volume */}
                    <Td>
                      <VolumeBar ratio={signal.volumeRatio} />
                    </Td>

                    {/* Strength */}
                    <Td className="pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`}
                        />
                        <Badge
                          variant="outline"
                          className={`text-[10px] border ${cfg.badge}`}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                    </Td>
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
              signals
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
        )}
      </CardContent>
    </Card>
  );
}
