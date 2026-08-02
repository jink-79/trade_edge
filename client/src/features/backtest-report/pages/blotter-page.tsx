import { useMemo, useState } from "react";
import { ChevronDown, Eye, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePulseWeeks, usePulseWeekByDate } from "@/features/pulse/hooks/use-pulse";
import type { PulseSignalOutcome, PulseWeekRow, PulseWeekSummary } from "@/features/pulse/types/pulse.types";
import { Metric, NotAvailable, ReportShell, Section } from "../components/report-shell";
import { WeekRangePicker, type WeekRange } from "../components/week-range-picker";
import { useBacktestReport } from "../hooks/use-backtest-report";
import { inr } from "../types/report.types";

const statusTone: Record<string, string> = {
  new: "bg-primary/12 text-primary ring-primary/25",
  open: "bg-accent/60 text-foreground ring-border",
  exited: "bg-muted text-muted-foreground ring-border",
  target: "bg-primary/12 text-primary ring-primary/25",
  stop: "bg-destructive/12 text-destructive ring-destructive/25",
};

const fmtWeekLabel = (weekStart: string) =>
  new Date(`${weekStart}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function StrongestTable({ rows }: { rows: PulseWeekRow[] }) {
  if (rows.length === 0) return <div className="p-5"><NotAvailable label="No positions this week" /></div>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
          <th className="px-5 py-3 font-medium">Symbol</th>
          <th className="px-4 py-3 font-medium">Sector / Cap</th>
          <th className="px-4 py-3 font-medium text-right">Qty</th>
          <th className="px-4 py-3 font-medium text-right">Entry</th>
          <th className="px-4 py-3 font-medium text-right">Stop</th>
          <th className="px-4 py-3 font-medium text-right">Target</th>
          <th className="px-4 py-3 font-medium text-right">Mark / Exit</th>
          <th className="px-4 py-3 font-medium text-right">P&amp;L (₹)</th>
          <th className="px-4 py-3 font-medium text-right">Return %</th>
          <th className="px-4 py-3 font-medium text-right">Held</th>
          <th className="px-4 py-3 font-medium">Entry date</th>
          <th className="px-5 py-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const up = p.pnl >= 0;
          const st = p.status === "exited" ? (p.exitReason?.toLowerCase().includes("target") ? "target" : "stop") : p.status;
          return (
            <tr key={`${p.symbol}-${p.entryDate}`} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
              <td className="px-5 py-3 font-mono text-[13px] font-medium">{p.symbol}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {p.sector ?? "—"} {p.marketCap ? `· ${p.marketCap}` : ""}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{p.shares}</td>
              <td className="px-4 py-3 text-right tabular-nums">{inr(p.entryPrice)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-destructive">{inr(p.stop)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-primary">{inr(p.target)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{inr(p.markPrice)}</td>
              <td className={`px-4 py-3 text-right tabular-nums ${up ? "text-primary" : "text-destructive"}`}>
                {up ? "+" : ""}{inr(p.pnl)}
              </td>
              <td className={`px-4 py-3 text-right tabular-nums ${up ? "text-primary" : "text-destructive"}`}>
                {p.returnPct.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{p.weeksHeld}w</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{p.entryDate}</td>
              <td className="px-5 py-3">
                <span className={`rounded-md px-2 py-0.5 text-[11px] ring-1 ${statusTone[st] ?? statusTone.open}`}>
                  {p.status === "exited" ? (p.exitReason ?? "Exited") : p.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AllSignalsTable({ rows }: { rows: PulseSignalOutcome[] }) {
  if (rows.length === 0) return <div className="p-5"><NotAvailable label="No signals fired this week" /></div>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
          <th className="px-5 py-3 font-medium">Symbol</th>
          <th className="px-4 py-3 font-medium">Sector / Cap</th>
          <th className="px-4 py-3 font-medium text-right">RS-55</th>
          <th className="px-4 py-3 font-medium text-right">Entry</th>
          <th className="px-4 py-3 font-medium text-right">Exit / LTP</th>
          <th className="px-4 py-3 font-medium text-right">Return %</th>
          <th className="px-4 py-3 font-medium text-right">P&amp;L (₹)</th>
          <th className="px-4 py-3 font-medium text-right">Held</th>
          <th className="px-4 py-3 font-medium">Exit date</th>
          <th className="px-4 py-3 font-medium">Outcome</th>
          <th className="px-5 py-3 font-medium">Taken</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => {
          const up = s.returnPct >= 0;
          return (
            <tr key={s.symbol} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
              <td className="px-5 py-3 font-mono text-[13px] font-medium">{s.symbol}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {s.sector ?? "—"} {s.marketCap ? `· ${s.marketCap}` : ""}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{s.rs != null ? s.rs.toFixed(3) : "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums">{inr(s.entryPrice)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{inr(s.exitPrice)}</td>
              <td className={`px-4 py-3 text-right tabular-nums ${up ? "text-primary" : "text-destructive"}`}>
                {s.returnPct.toFixed(1)}%
              </td>
              <td className={`px-4 py-3 text-right tabular-nums ${s.pnlNotional >= 0 ? "text-primary" : "text-destructive"}`}>
                {inr(s.pnlNotional)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{s.weeksHeld}w</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{s.exitDate ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`rounded-md px-2 py-0.5 text-[11px] ring-1 ${statusTone[s.outcomeStatus] ?? statusTone.open}`}>
                  {s.outcomeStatus}
                </span>
              </td>
              <td className="px-5 py-3">
                {s.taken ? (
                  <span className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-primary/12 text-primary ring-primary/25">Taken</span>
                ) : (
                  <span className="text-muted-foreground text-xs">skipped</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function WeekRow({
  variant,
  summary,
  onlyStrongest,
  expanded,
  onToggle,
}: {
  variant: string;
  summary: PulseWeekSummary;
  onlyStrongest: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const weekStart = summary.week.slice(0, 10);
  // Truly lazy: passing "" as the date disables the query (see
  // usePulseWeekByDate's `enabled`), so the full per-week blotter is only
  // fetched the moment this row is actually expanded — not on render.
  const { data: week, isLoading } = usePulseWeekByDate(variant, expanded ? weekStart : "");
  const rows = week?.rows ?? [];
  const allSignals = week?.allSignals ?? [];

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 text-left">
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${expanded ? "" : "-rotate-90"}`} />
        <div className="font-medium text-sm">{fmtWeekLabel(weekStart)}</div>
        <div className="ml-auto flex items-center gap-6 text-xs tabular-nums">
          <span className="text-muted-foreground">
            New <span className="text-foreground">{summary.counts?.new ?? "—"}</span>
          </span>
          <span className="text-muted-foreground">
            Open <span className="text-foreground">{summary.counts?.open ?? "—"}</span>
          </span>
          <span className="text-muted-foreground">
            Exits <span className="text-foreground">{summary.counts?.exits ?? "—"}</span>
          </span>
          <span className={`font-medium ${summary.realizedPnl >= 0 ? "text-primary" : "text-destructive"}`}>
            {inr(summary.realizedPnl)}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/60 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 text-sm text-muted-foreground">Loading…</div>
          ) : onlyStrongest ? (
            <StrongestTable rows={rows} />
          ) : (
            <AllSignalsTable rows={allSignals} />
          )}
        </div>
      )}
    </div>
  );
}

const defaultRange = (): WeekRange => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 8 * 7);
  return { from, to };
};

export function BlotterPage() {
  const { versions, current, isLoading } = useBacktestReport();
  const [range, setRange] = useState<WeekRange>(defaultRange);
  const [onlyStrongest, setOnlyStrongest] = useState(true);
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());

  const variant = current ? `v${current.version}-${current.universe}` : "";
  const { data: summaries = [], isLoading: weeksLoading } = usePulseWeeks(variant, {
    from: range.from.toISOString().slice(0, 10),
    to: range.to.toISOString().slice(0, 10),
  });
  const orderedWeeks = useMemo(() => [...summaries].reverse(), [summaries]);

  const toggleWeek = (week: string) =>
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading report…</div>;
  }

  const hasWeeks = summaries.length > 0;

  return (
    <ReportShell title="Week-wise blotter" desc="Portfolio blotter, week by week" versions={versions} current={current}>
      {hasWeeks && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Weeks in window" value={String(summaries.length)} />
          <Metric
            label="Latest equity"
            value={inr(summaries[summaries.length - 1]?.equity ?? null)}
          />
          <Metric
            label="Realized P&L (window)"
            value={inr(summaries.reduce((a, w) => a + w.realizedPnl, 0))}
            tone={summaries.reduce((a, w) => a + w.realizedPnl, 0) >= 0 ? "pos" : "neg"}
          />
          <Metric
            label="Unrealized P&L (latest)"
            value={inr(summaries[summaries.length - 1]?.unrealizedPnl ?? null)}
            tone={(summaries[summaries.length - 1]?.unrealizedPnl ?? 0) >= 0 ? "pos" : "neg"}
          />
        </div>
      )}

      {/* Controls (date range + view toggle) always render — even when there's
          no data — so the view is navigable regardless of source/emptiness. */}
      <Section
        title="Weekly blotter"
        desc="Expand a week to fetch and see every position it carried — nothing loads until you open it"
        icon={ListChecks}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <WeekRangePicker range={range} onChange={setRange} />
            <Button size="sm" variant={onlyStrongest ? "secondary" : "outline"} onClick={() => setOnlyStrongest(true)}>
              <Eye className="size-3.5" /> Strongest (real book)
            </Button>
            <Button size="sm" variant={!onlyStrongest ? "secondary" : "outline"} onClick={() => setOnlyStrongest(false)}>
              All signals
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {weeksLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading weeks…</div>
          ) : orderedWeeks.length === 0 ? (
            <NotAvailable
              label="No weeks posted in this window"
              hint="Pick a different date range. If this is an uploaded version, its weekly blotter has to be published first (research/publish_v1_weeks.py for v1)."
            />
          ) : (
            orderedWeeks.map((w) => (
              <WeekRow
                key={w.week}
                variant={variant}
                summary={w}
                onlyStrongest={onlyStrongest}
                expanded={openWeeks.has(w.week)}
                onToggle={() => toggleWeek(w.week)}
              />
            ))
          )}
        </div>
      </Section>
    </ReportShell>
  );
}
