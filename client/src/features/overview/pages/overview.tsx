import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Percent,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { fmtINR } from "@/lib/positions-utils";
import { cn } from "@/lib/utils";
import { useGenerateWeeklyRecap, useWeeklyRecap } from "../hooks/use-overview";

const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${fmtINR(n)}`;

const fmtWeekDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function OverviewPage() {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStartParam = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d.toISOString().slice(0, 10);
  }, [weekOffset]);

  const { data, isLoading } = useWeeklyRecap(weekStartParam);
  const generateMut = useGenerateWeeklyRecap(weekStartParam);

  const stats = data?.stats;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight flex items-center gap-2.5">
                <div className="size-8 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
                  <CalendarRange className="size-4 text-primary" />
                </div>
                Weekly Recap
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 ml-[42px]">
                What actually happened this week, and an AI read on it.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 px-1.5 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setWeekOffset((w) => w - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="font-display text-sm font-medium px-2 min-w-[160px] text-center tabular">
                {stats ? `${fmtWeekDate(stats.weekStart)} – ${fmtWeekDate(stats.weekEnd)}` : "…"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={isCurrentWeek}
                onClick={() => setWeekOffset((w) => w + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              {!isCurrentWeek && (
                <Button variant="outline" size="sm" className="h-7 ml-1" onClick={() => setWeekOffset(0)}>
                  This week
                </Button>
              )}
            </div>
          </div>

          {isLoading || !stats ? (
            <p className="text-sm text-muted-foreground">Loading this week's recap…</p>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard
                  icon={Wallet}
                  label="Net P&L"
                  value={fmtSigned(stats.netPnl)}
                  positive={stats.netPnl >= 0}
                  foot="realised this week"
                  accent
                />
                <KpiCard
                  icon={Percent}
                  label="Win Rate"
                  value={`${stats.winRate.toFixed(0)}%`}
                  positive={stats.winRate >= 50}
                  foot={`${stats.exitsCount} closed this week`}
                />
                <KpiCard
                  icon={ArrowUpRight}
                  label="Entries"
                  value={String(stats.entriesCount)}
                  positive
                  foot="positions opened"
                />
                <KpiCard
                  icon={ArrowDownRight}
                  label="Exits"
                  value={String(stats.exitsCount)}
                  positive
                  foot="positions closed"
                />
                <KpiCard
                  icon={Layers}
                  label="Open Positions"
                  value={String(stats.openPositionsCount)}
                  positive
                  foot="currently held"
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Unrealized P&L"
                  value={fmtSigned(stats.openUnrealizedPnl)}
                  positive={stats.openUnrealizedPnl >= 0}
                  foot="open positions, since entry"
                />
              </div>

              {/* AI recap */}
              <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" /> AI recap
                    </CardTitle>
                    <CardDescription>
                      Generated from this week's actual numbers — no invented context.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs shrink-0"
                    disabled={generateMut.isPending}
                    onClick={() => generateMut.mutate()}
                  >
                    {generateMut.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    {data?.aiSummary ? "Regenerate" : "Generate"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {generateMut.isPending ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="size-4 animate-spin" /> Writing this week's recap…
                    </div>
                  ) : data?.aiSummary ? (
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {data.aiSummary}
                      </p>
                      {data.aiSummaryGeneratedAt && (
                        <div className="text-[11px] text-muted-foreground">
                          Generated {fmtDateTime(data.aiSummaryGeneratedAt)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not generated yet for this week — click Generate for a short read on how
                      the week went.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* entries / exits */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6">
                  <WeekTable
                    title="Entries this week"
                    empty="No positions opened this week."
                    rows={data.entries}
                    onRowClick={(id) => navigate(`/trades/${id}`)}
                    columns={["Symbol", "Date", "Qty", "Entry"]}
                    align={["left", "left", "right", "right"]}
                    renderRow={(e) => (
                      <>
                        <TableCell className="pl-6 pr-3 py-3 font-medium">{e.symbol}</TableCell>
                        <TableCell className="pl-3 pr-3 py-3 text-muted-foreground tabular whitespace-nowrap">
                          {fmtWeekDate(e.date)}
                        </TableCell>
                        <TableCell className="pl-3 pr-3 py-3 text-right tabular">{e.quantity}</TableCell>
                        <TableCell className="pl-3 pr-6 py-3 text-right tabular text-muted-foreground">
                          {fmtINR(e.price)}
                        </TableCell>
                      </>
                    )}
                  />
                </div>
                <div className="col-span-12 lg:col-span-6">
                  <WeekTable
                    title="Exits this week"
                    empty="No positions closed this week."
                    rows={data.exits}
                    onRowClick={(id) => navigate(`/trades/${id}`)}
                    columns={["Symbol", "Date", "Outcome", "P&L"]}
                    align={["left", "left", "left", "right"]}
                    renderRow={(x) => (
                      <>
                        <TableCell className="pl-6 pr-3 py-3 font-medium">{x.symbol}</TableCell>
                        <TableCell className="pl-3 pr-3 py-3 text-muted-foreground tabular whitespace-nowrap">
                          {fmtWeekDate(x.date)}
                        </TableCell>
                        <TableCell className="pl-3 pr-3 py-3 text-muted-foreground">{x.outcome}</TableCell>
                        <TableCell
                          className={`pl-3 pr-6 py-3 text-right tabular ${
                            x.pnl >= 0 ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {fmtSigned(x.pnl)}
                        </TableCell>
                      </>
                    )}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function WeekTable<T extends { id: string }>({
  title,
  empty,
  rows,
  columns,
  align,
  renderRow,
  onRowClick,
}: {
  title: string;
  empty: string;
  rows: T[];
  columns: string[];
  align: ("left" | "right")[];
  renderRow: (row: T) => React.ReactNode;
  onRowClick: (id: string) => void;
}) {
  return (
    <Card className="border-border/70 bg-card/70 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 px-6">{empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={cn("pl-6 pr-3", align[0] === "right" && "text-right")}>
                    {columns[0]}
                  </TableHead>
                  <TableHead className={cn("pl-3 pr-3", align[1] === "right" && "text-right")}>
                    {columns[1]}
                  </TableHead>
                  <TableHead className={cn("pl-3 pr-3", align[2] === "right" && "text-right")}>
                    {columns[2]}
                  </TableHead>
                  <TableHead className={cn("pl-3 pr-6", align[3] === "right" && "text-right")}>
                    {columns[3]}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick(row.id)}
                    className="cursor-pointer border-border/60 transition-colors hover:bg-accent/20"
                  >
                    {renderRow(row)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
