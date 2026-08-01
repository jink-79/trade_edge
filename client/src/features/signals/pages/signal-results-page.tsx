import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
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
import { usePreferences } from "@/features/preferences/hooks/use-preferences";
import { PulseResultsView } from "@/features/pulse/components/pulse-results";
import { useSignalsByDate } from "@/features/signals/hooks/use-signals-by-date";
import { inr, pct, toDayRows } from "@/features/signals/utils/signals-format";

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const fmtLong = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const statusTone: Record<string, string> = {
  Target: "bg-primary/12 text-primary ring-primary/25",
  Stop: "bg-destructive/12 text-destructive ring-destructive/25",
  Open: "bg-accent/60 text-foreground ring-border",
  "Time exit": "bg-muted text-muted-foreground ring-border",
};

function Rsi2SignalResultsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [q, setQ] = useState("");
  const iso = toISO(date);

  const { data: prefs } = usePreferences();
  const capital = prefs?.defaultCapital ?? 700000;
  const riskFrac = (prefs?.riskPerTrade ?? 1) / 100;

  const { data: signals = [], isLoading } = useSignalsByDate(iso);
  const rows = useMemo(
    () => toDayRows(signals, capital, riskFrac),
    [signals, capital, riskFrac],
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q.toLowerCase()) ||
          r.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [rows, q],
  );

  const summary = useMemo(() => {
    const pnl = rows.reduce((a, r) => a + (r.exit - r.entry) * r.qty, 0);
    const wins = rows.filter((r) => r.exit > r.entry).length;
    const deployed = rows.reduce((a, r) => a + r.entry * r.qty, 0);
    return {
      pnl,
      winRate: rows.length ? (wins / rows.length) * 100 : 0,
      deployed,
      count: rows.length,
      avgDays: rows.length ? rows.reduce((a, r) => a + r.days, 0) / rows.length : 0,
    };
  }, [rows]);

  const shift = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  return (
    <div className="min-w-0">
      <header className="h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/signals"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight">Signal results</h1>
            <p className="text-xs text-muted-foreground">Stock-wise outcome for every signal day</p>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6 max-w-[1400px]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-border/70 bg-card/60 backdrop-blur">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Previous day">
              <ChevronLeft className="size-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="min-w-[210px] font-medium">
                  <CalendarDays className="size-4" /> {fmtLong(iso)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Next day">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Today</Button>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbol…" className="pl-9" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { l: "Signals", v: String(summary.count) },
            { l: "Win rate", v: `${summary.winRate.toFixed(1)}%`, tone: summary.winRate >= 50 ? "pos" : "neg" },
            { l: "Net P&L", v: inr(summary.pnl), tone: summary.pnl >= 0 ? "pos" : "neg" },
            { l: "Capital deployed", v: inr(summary.deployed) },
            { l: "Avg hold", v: `${summary.avgDays.toFixed(1)}d` },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur px-5 py-4 shadow-[var(--shadow-card)]">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.l}</div>
              <div className={`mt-1 font-display text-xl font-semibold tabular ${
                s.tone === "pos" ? "text-primary" : s.tone === "neg" ? "text-destructive" : ""
              }`}>{s.v}</div>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="font-display text-[15px] font-semibold tracking-tight">
              Stock-wise results · {fmtLong(iso)}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
                  <th className="px-6 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Sector</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Entry</th>
                  <th className="px-4 py-3 font-medium text-right">Exit / LTP</th>
                  <th className="px-4 py-3 font-medium text-right">P&amp;L (₹)</th>
                  <th className="px-4 py-3 font-medium text-right">P&amp;L %</th>
                  <th className="px-4 py-3 font-medium text-right">Days</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const pl = (r.exit - r.entry) * r.qty;
                  const plPct = ((r.exit - r.entry) / r.entry) * 100;
                  const up = pl >= 0;
                  return (
                    <tr key={r.symbol} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                      <td className="px-6 py-3">
                        <div className="font-mono text-[13px] font-medium">{r.symbol}</div>
                        <div className="text-xs text-muted-foreground">{r.name}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.sector}</td>
                      <td className="px-4 py-3 text-right tabular">{r.qty}</td>
                      <td className="px-4 py-3 text-right tabular">{inr(r.entry)}</td>
                      <td className="px-4 py-3 text-right tabular">{inr(r.exit)}</td>
                      <td className={`px-4 py-3 text-right tabular ${up ? "text-primary" : "text-destructive"}`}>
                        {up ? "+" : ""}{inr(pl)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular ${up ? "text-primary" : "text-destructive"}`}>
                        {pct(plPct)}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-muted-foreground">{r.days}d</td>
                      <td className="px-6 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] ring-1 ${statusTone[r.status] ?? statusTone.Open}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      {isLoading ? "Loading…" : "No signals for this day."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// Strategy-aware entry point: Pulse shows the v10 dashboard; otherwise the RSI_2
// day-by-day stock results. Only usePreferences runs here so hook order is stable.
export function SignalResultsPage() {
  const { data: prefs, isLoading } = usePreferences();
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (prefs?.activeStrategy === "pulse") return <PulseResultsView />;
  return <Rsi2SignalResultsPage />;
}
