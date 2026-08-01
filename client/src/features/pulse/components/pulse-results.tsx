import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  usePulsePerformance,
  usePulseWeeks,
  usePulseWeekByDate,
} from "../hooks/use-pulse";
import { fmtNum, fmtRs } from "./pulse-format";
import type { PulseWeekRow, PulseSignalOutcome } from "../types/pulse.types";

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const fmtLong = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const money = (n: number) =>
  `${n >= 0 ? "+" : "-"}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;

const tone: Record<string, string> = {
  Target: "bg-primary/12 text-primary ring-primary/25",
  Stop: "bg-destructive/12 text-destructive ring-destructive/25",
  New: "bg-sky-500/12 text-sky-500 ring-sky-500/25",
  Open: "bg-accent/60 text-foreground ring-border",
};

function rowStatus(r: PulseWeekRow): string {
  if (r.status === "exited") return (r.exitReason ?? "").replace("ATR ", "") || "Exited";
  return r.status === "new" ? "New" : "Open";
}
function sigStatus(s: PulseSignalOutcome): string {
  return s.outcomeStatus === "target" ? "Target" : s.outcomeStatus === "stop" ? "Stop" : "Open";
}

export function PulseResultsView() {
  const { data: perf = [] } = usePulsePerformance();
  const [variant, setVariant] = useState<string | null>(null);
  const activeVariant =
    variant ??
    perf.find((v) => v.variant.includes("fno"))?.variant ??
    perf[0]?.variant ??
    "v10-fno";

  const [date, setDate] = useState<Date>(new Date());
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"strongest" | "all">("strongest");
  const iso = toISO(date);

  const { data: summaries = [] } = usePulseWeeks(activeVariant);
  const { data: week, isLoading } = usePulseWeekByDate(activeVariant, iso);

  // On first load (or variant change), jump to the latest available week.
  useEffect(() => {
    if (summaries.length) {
      setDate(new Date(`${summaries[summaries.length - 1].week.slice(0, 10)}T00:00:00`));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVariant, summaries.length]);

  const weekList = useMemo(() => summaries.map((s) => s.week.slice(0, 10)), [summaries]);
  const curWeek = week?.week?.slice(0, 10);
  const curIdx = curWeek ? weekList.indexOf(curWeek) : -1;
  const goTo = (idx: number) => {
    if (idx >= 0 && idx < weekList.length)
      setDate(new Date(`${weekList[idx]}T00:00:00`));
  };

  const rows = week?.rows ?? [];
  const sigs = week?.allSignals ?? [];

  const strongest = useMemo(
    () => rows.filter((r) => r.symbol.toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );
  const allRows = useMemo(
    () => sigs.filter((s) => s.symbol.toLowerCase().includes(q.toLowerCase())),
    [sigs, q],
  );

  const summary = useMemo(() => {
    if (mode === "strongest") {
      return [
        { l: "Equity", v: `₹${((week?.equity ?? 0) / 100000).toFixed(2)}L` },
        {
          l: "Realized P&L",
          v: money(week?.realizedPnl ?? 0),
          tone: (week?.realizedPnl ?? 0) >= 0 ? "pos" : "neg",
        },
        {
          l: "Unrealized P&L",
          v: money(week?.unrealizedPnl ?? 0),
          tone: (week?.unrealizedPnl ?? 0) >= 0 ? "pos" : "neg",
        },
        { l: "Open positions", v: String(week?.counts?.open ?? 0) },
        { l: "Exits", v: String(week?.counts?.exits ?? 0) },
      ];
    }
    const wins = sigs.filter((s) => s.outcomeStatus === "target").length;
    const resolved = sigs.filter((s) => s.outcomeStatus !== "open").length;
    const avgRet = sigs.length ? sigs.reduce((a, s) => a + s.returnPct, 0) / sigs.length : 0;
    return [
      { l: "Signals", v: String(sigs.length) },
      { l: "Taken", v: String(sigs.filter((s) => s.taken).length) },
      {
        l: "Hit target",
        v: resolved ? `${((wins / resolved) * 100).toFixed(0)}%` : "—",
        tone: "pos",
      },
      { l: "Avg return", v: `${avgRet.toFixed(1)}%`, tone: avgRet >= 0 ? "pos" : "neg" },
      { l: "Open", v: String(sigs.filter((s) => s.outcomeStatus === "open").length) },
    ];
  }, [mode, week, sigs]);

  return (
    <div className="min-w-0">
      <header className="h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Pulse Breaker — weekly results
          </h1>
          <p className="text-xs text-muted-foreground">
            Portfolio blotter for the selected week: entries, held positions &amp; exits with PnL
          </p>
        </div>
        {perf.length > 1 && (
          <div className="hidden sm:flex gap-1.5">
            {perf.map((v) => (
              <Button
                key={v.variant}
                size="sm"
                variant={activeVariant === v.variant ? "default" : "outline"}
                onClick={() => setVariant(v.variant)}
              >
                {v.label ?? v.variant}
              </Button>
            ))}
          </div>
        )}
      </header>

      <div className="p-8 space-y-6 max-w-[1400px]">
        {/* Controls: week nav + all/strongest + search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-border/70 bg-card/60 backdrop-blur">
            <Button variant="ghost" size="icon" onClick={() => goTo(curIdx - 1)} aria-label="Previous week">
              <ChevronLeft className="size-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="min-w-[210px] font-medium">
                  <CalendarDays className="size-4" /> {fmtLong(curWeek ?? iso)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => goTo(curIdx + 1)} aria-label="Next week">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => goTo(weekList.length - 1)}>
            Latest
          </Button>

          <div className="flex items-center rounded-xl border border-border/70 bg-card/60 p-1">
            <button
              onClick={() => setMode("strongest")}
              className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
                mode === "strongest" ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "text-muted-foreground"
              }`}
            >
              Strongest (our book)
            </button>
            <button
              onClick={() => setMode("all")}
              className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
                mode === "all" ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "text-muted-foreground"
              }`}
            >
              All signals
            </button>
          </div>

          <div className="relative ml-auto w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbol…" className="pl-9" />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {summary.map((s) => (
            <div key={s.l} className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur px-5 py-4 shadow-[var(--shadow-card)]">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.l}</div>
              <div className={`mt-1 font-display text-xl font-semibold tabular-nums ${
                s.tone === "pos" ? "text-primary" : s.tone === "neg" ? "text-destructive" : ""
              }`}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Blotter table */}
        <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="font-display text-[15px] font-semibold tracking-tight">
              {mode === "strongest" ? "Portfolio blotter" : "All fired signals"} · {fmtLong(curWeek ?? iso)}
            </h2>
          </div>
          <div className="overflow-x-auto">
            {mode === "strongest" ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
                    <th className="px-6 py-3 font-medium">Symbol</th>
                    <th className="px-4 py-3 font-medium">Sector</th>
                    <th className="px-4 py-3 font-medium">Cap</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Entry</th>
                    <th className="px-4 py-3 font-medium text-right">Mark / Exit</th>
                    <th className="px-4 py-3 font-medium text-right">P&amp;L (₹)</th>
                    <th className="px-4 py-3 font-medium text-right">P&amp;L %</th>
                    <th className="px-4 py-3 font-medium text-right">Held</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {strongest.map((r) => {
                    const up = r.pnl >= 0;
                    const st = rowStatus(r);
                    return (
                      <tr key={`${r.symbol}-${r.entryDate}`} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                        <td className="px-6 py-3 font-mono text-[13px] font-medium">{r.symbol}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{r.sector ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{r.marketCap ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.shares}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtRs(r.entryPrice)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtRs(r.markPrice)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${up ? "text-primary" : "text-destructive"}`}>{money(r.pnl)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${up ? "text-primary" : "text-destructive"}`}>{r.returnPct.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.weeksHeld}w</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] ring-1 ${tone[st] ?? tone.Open}`}>{st}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {strongest.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        {isLoading ? "Loading…" : "No positions this week."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
                    <th className="px-6 py-3 font-medium">Symbol</th>
                    <th className="px-4 py-3 font-medium">Sector</th>
                    <th className="px-4 py-3 font-medium">Cap</th>
                    <th className="px-4 py-3 font-medium text-right">RS-55</th>
                    <th className="px-4 py-3 font-medium text-right">Entry</th>
                    <th className="px-4 py-3 font-medium text-right">Exit / LTP</th>
                    <th className="px-4 py-3 font-medium text-right">Return %</th>
                    <th className="px-4 py-3 font-medium text-right">Held</th>
                    <th className="px-4 py-3 font-medium">Outcome</th>
                    <th className="px-6 py-3 font-medium">Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {allRows.map((s) => {
                    const up = s.returnPct >= 0;
                    const st = sigStatus(s);
                    return (
                      <tr key={s.symbol} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                        <td className="px-6 py-3 font-mono text-[13px] font-medium">{s.symbol}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{s.sector ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{s.marketCap ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(s.rs, 3)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtRs(s.entryPrice)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtRs(s.exitPrice)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${up ? "text-primary" : "text-destructive"}`}>{s.returnPct.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{s.weeksHeld}w</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] ring-1 ${tone[st] ?? tone.Open}`}>{st}</span>
                        </td>
                        <td className="px-6 py-3">
                          {s.taken ? (
                            <span className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-primary/12 text-primary ring-primary/25">Taken</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">skipped</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {allRows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        {isLoading ? "Loading…" : "No signals fired this week."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
