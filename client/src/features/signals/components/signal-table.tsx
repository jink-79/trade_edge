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
import type {
  EnrichedSignal,
  SignalStrength,
  SortCol,
  SortState,
} from "../types/signals.types";

const STRENGTH_CFG: Record<
  SignalStrength,
  { label: string; dot: string; badge: string }
> = {
  strong: {
    label: "Strong",
    dot: "bg-primary",
    badge: "text-primary bg-primary/10 border-primary/30",
  },
  moderate: {
    label: "Moderate",
    dot: "bg-[oklch(0.82_0.16_85)]",
    badge:
      "text-[oklch(0.82_0.16_85)] bg-[oklch(0.82_0.16_85/0.10)] border-[oklch(0.82_0.16_85/0.3)]",
  },
  weak: {
    label: "Weak",
    dot: "bg-muted-foreground",
    badge: "text-muted-foreground bg-muted/30 border-border/60",
  },
};

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

const STRENGTH_FILTERS = ["all", "strong", "moderate", "weak"] as const;
const PAGE_SIZE = 12;

function SortIcon({ col, sortState }: { col: SortCol; sortState: SortState }) {
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

function VolumeBar({ ratio }: { ratio: number }) {
  const pct = Math.min(100, ((ratio - 1) / 2) * 100);
  const color =
    ratio >= 2 ? "bg-primary" : ratio >= 1.5 ? "bg-[oklch(0.82_0.16_85)]" : "bg-muted-foreground/50";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-secondary/60 overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(0, pct)}%` }}
        />
      </div>
      <span
        className={`tabular text-xs font-medium ${
          ratio >= 2
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

interface SignalTableProps {
  signals: EnrichedSignal[];
}

export function SignalTable({ signals }: SignalTableProps) {
  const [search, setSearch] = useState("");
  const [strength, setStrength] =
    useState<(typeof STRENGTH_FILTERS)[number]>("all");
  const [sortState, setSortState] = useState<SortState>({
    col: "volumeRatio",
    dir: "desc",
  });
  const [page, setPage] = useState(1);

  const sort = (col: SortCol) => {
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
      rows = rows.filter((s) => s.symbol.toLowerCase().includes(q));
    }
    if (strength !== "all") rows = rows.filter((s) => s.strength === strength);

    return [...rows].sort((a, b) => {
      const mul = sortState.dir === "asc" ? 1 : -1;
      const va = a[sortState.col];
      const vb = b[sortState.col];
      if (typeof va === "string" && typeof vb === "string")
        return va.localeCompare(vb) * mul;
      return ((va as number) - (vb as number)) * mul;
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
            <Flame className="size-4 text-primary" /> Breakout Signals
          </CardTitle>
          <CardDescription>
            {filtered.length} signal{filtered.length !== 1 ? "s" : ""} · sorted
            by {sortState.col} ({sortState.dir})
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Symbol…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 w-40 text-sm bg-secondary/50 border-border/60"
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
                <Th className="text-right">
                  <button
                    onClick={() => sort("close")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    Close <SortIcon col="close" sortState={sortState} />
                  </button>
                </Th>
                <Th className="text-right">
                  <button
                    onClick={() => sort("breakout_level")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    Breakout{" "}
                    <SortIcon col="breakout_level" sortState={sortState} />
                  </button>
                </Th>
                <Th className="text-right">
                  <button
                    onClick={() => sort("aboveBreakoutPct")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    Above{" "}
                    <SortIcon col="aboveBreakoutPct" sortState={sortState} />
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
                <Th className="text-right pr-6">Strength</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground text-sm border-t border-border/60"
                  >
                    No signals match your filters.
                  </td>
                </tr>
              )}
              {paginated.map((s) => {
                const cfg = STRENGTH_CFG[s.strength];
                const abovePos = s.aboveBreakoutPct >= 0;
                return (
                  <tr
                    key={s.symbol}
                    className="border-t border-border/60 hover:bg-accent/20 transition-colors"
                  >
                    <Td className="pl-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-8 rounded-lg grid place-items-center text-[10px] font-bold ring-1 ring-border/70 shrink-0"
                          style={{ background: "oklch(0.26 0.015 252)" }}
                        >
                          {s.symbol.slice(0, 2)}
                        </div>
                        <span className="font-medium">{s.symbol}</span>
                      </div>
                    </Td>
                    <Td className="text-right tabular font-medium">
                      ₹{fmtINR(s.close)}
                    </Td>
                    <Td className="text-right tabular text-muted-foreground">
                      ₹{fmtINR(s.breakout_level)}
                    </Td>
                    <Td
                      className={`text-right tabular text-xs font-medium ${abovePos ? "text-primary" : "text-destructive"}`}
                    >
                      {abovePos ? "+" : ""}
                      {s.aboveBreakoutPct.toFixed(2)}%
                    </Td>
                    <Td>
                      <VolumeBar ratio={s.volumeRatio} />
                    </Td>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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
