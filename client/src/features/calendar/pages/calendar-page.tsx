import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Download,
  Filter,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarSkeleton } from "@/components/page-skeletons";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar";
import type { EventKind, TradeEvent } from "../types/calendar.types";

/* ---------- helpers ---------- */

const fmtInr = (n: number) => {
  const abs = Math.round(Math.abs(n)).toLocaleString("en-IN");
  return (n < 0 ? "-₹" : "₹") + abs;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- visual config ---------- */

const kindMeta: Record<
  EventKind,
  { label: string; icon: typeof CalendarDays; tone: string; ring: string; bg: string; dot: string }
> = {
  entry: {
    label: "Entry",
    icon: ArrowUpRight,
    tone: "text-primary",
    ring: "ring-primary/30",
    bg: "bg-primary/10",
    dot: "bg-primary",
  },
  exit: {
    label: "Exit",
    icon: ArrowDownRight,
    tone: "text-emerald-400",
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
};

const ALL_KINDS: EventKind[] = ["entry", "exit"];

/* =========================================================================
   PAGE
   ========================================================================= */

export function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [view, setView] = useState<"month" | "timeline">("month");
  const [activeKinds, setActiveKinds] = useState<EventKind[]>(ALL_KINDS);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data, isLoading } = useCalendar(cursor.year, cursor.month);
  const events = data?.events ?? [];

  const visibleEvents = useMemo(
    () => events.filter((e) => activeKinds.includes(e.kind)),
    [events, activeKinds],
  );

  // Build month grid (Mon-first)
  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const lastDate = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const startOffset = (first.getDay() + 6) % 7; // 0=Mon
    const cells: Array<{ day: number | null }> = [];
    for (let i = 0; i < startOffset; i++) cells.push({ day: null });
    for (let d = 1; d <= lastDate; d++) cells.push({ day: d });
    while (cells.length % 7 !== 0) cells.push({ day: null });
    return cells;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<number, TradeEvent[]>();
    visibleEvents.forEach((e) => {
      const arr = map.get(e.day) ?? [];
      arr.push(e);
      map.set(e.day, arr);
    });
    return map;
  }, [visibleEvents]);

  const totals = useMemo(() => {
    const entries = visibleEvents.filter((e) => e.kind === "entry").length;
    const exits = visibleEvents.filter((e) => e.kind === "exit");
    const realized = exits.reduce((s, e) => s + (e.pnl ?? 0), 0);
    const wins = exits.filter((e) => (e.pnl ?? 0) > 0).length;
    const wr = exits.length ? (wins / exits.length) * 100 : 0;

    const pnlByDay = new Map<number, number>();
    for (const e of exits) {
      pnlByDay.set(e.day, (pnlByDay.get(e.day) ?? 0) + (e.pnl ?? 0));
    }
    let bestDay: number | null = null;
    let bestPnl = 0;
    for (const [day, pnl] of pnlByDay) {
      if (bestDay === null || pnl > bestPnl) {
        bestDay = day;
        bestPnl = pnl;
      }
    }

    return { entries, exits: exits.length, realized, wr, bestDay, bestPnl };
  }, [visibleEvents]);

  const selectedEvents = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  const goMonth = (dir: -1 | 1) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + dir, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const toggleKind = (k: EventKind) =>
    setActiveKinds((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );

  const isCurrentMonth =
    today.getFullYear() === cursor.year && today.getMonth() === cursor.month;

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight flex items-center gap-2.5">
                <div className="size-8 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
                  <CalendarDays className="size-4 text-primary" />
                </div>
                Trade Calendar
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 ml-[42px]">
                Entries, exits and events by day.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-border/70 bg-card/60 p-0.5">
                {(["month", "timeline"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "px-3 h-7 text-xs rounded-md capitalize transition-colors",
                      view === v
                        ? "bg-accent/80 text-foreground ring-1 ring-border/80"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => toast("Export coming soon")}
              >
                <Download className="size-4" />
                Export
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi
              label="Entries"
              value={totals.entries}
              sub="positions opened"
              icon={ArrowUpRight}
              tone="text-primary"
            />
            <Kpi
              label="Exits"
              value={totals.exits}
              sub={`${totals.wr.toFixed(0)}% win rate`}
              icon={ArrowDownRight}
              tone="text-emerald-400"
            />
            <Kpi
              label="Realized P&L"
              value={fmtInr(totals.realized)}
              sub="this month"
              icon={TrendingUp}
              tone={totals.realized >= 0 ? "text-emerald-400" : "text-destructive"}
            />
            <Kpi
              label="Best day"
              value={totals.bestDay != null ? String(totals.bestDay) : "—"}
              sub={totals.bestDay != null ? fmtInr(totals.bestPnl) : "no exits yet"}
              icon={CalendarClock}
              tone="text-amber-400"
            />
          </section>

          {/* Month nav + filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 px-1.5 py-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => goMonth(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <div className="font-display text-sm font-medium px-2 min-w-[140px] text-center">
                {MONTHS[cursor.month]} {cursor.year}
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => goMonth(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}
            >
              Today
            </Button>

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground inline-flex items-center gap-1.5 mr-1">
                <Filter className="size-3" /> Show
              </span>
              {ALL_KINDS.map((k) => {
                const m = kindMeta[k];
                const on = activeKinds.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleKind(k)}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] border transition-colors",
                      on
                        ? cn(m.bg, m.tone, "border-transparent ring-1", m.ring)
                        : "border-border/70 text-muted-foreground hover:text-foreground bg-card/40",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", m.dot)} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          {view === "month" ? (
            <div className="grid lg:grid-cols-[1fr_360px] gap-6">
              <Card className="border-border/70 bg-card/60 backdrop-blur overflow-hidden">
                <CardContent className="p-0">
                  {/* Weekday header */}
                  <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20">
                    {WEEKDAYS.map((w) => (
                      <div
                        key={w}
                        className="px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Cells */}
                  <div className="grid grid-cols-7">
                    {grid.map((cell, idx) => {
                      const isToday = isCurrentMonth && cell.day === today.getDate();
                      const selected = selectedDay === cell.day && cell.day !== null;
                      const dayEvents = cell.day ? byDay.get(cell.day) ?? [] : [];
                      const dayPnl = dayEvents.reduce((s, e) => s + (e.pnl ?? 0), 0);
                      return (
                        <button
                          key={idx}
                          disabled={!cell.day}
                          onClick={() => cell.day && setSelectedDay(cell.day)}
                          className={cn(
                            "relative text-left min-h-[112px] p-2.5 border-b border-r border-border/60 transition-colors",
                            (idx + 1) % 7 === 0 && "border-r-0",
                            !cell.day && "bg-muted/10",
                            cell.day && "hover:bg-accent/30",
                            selected && "bg-accent/40 ring-1 ring-inset ring-primary/40",
                          )}
                        >
                          {cell.day && (
                            <>
                              <div className="flex items-center justify-between">
                                <span
                                  className={cn(
                                    "tabular text-xs",
                                    isToday
                                      ? "size-6 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {cell.day}
                                </span>
                                {dayPnl !== 0 && (
                                  <span
                                    className={cn(
                                      "text-[10px] tabular font-medium",
                                      dayPnl > 0 ? "text-emerald-400" : "text-destructive",
                                    )}
                                  >
                                    {dayPnl > 0 ? "+" : ""}
                                    {fmtInr(dayPnl)}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 space-y-1">
                                {dayEvents.slice(0, 3).map((e) => {
                                  const m = kindMeta[e.kind];
                                  const Icon = m.icon;
                                  return (
                                    <div
                                      key={e.id}
                                      className={cn(
                                        "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10.5px] truncate ring-1",
                                        m.bg,
                                        m.ring,
                                      )}
                                    >
                                      <Icon className={cn("size-3 shrink-0", m.tone)} />
                                      <span className="truncate text-foreground/90">
                                        {e.symbol ?? e.title}
                                      </span>
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <div className="text-[10px] text-muted-foreground pl-1.5">
                                    +{dayEvents.length - 3} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Day detail */}
              <Card className="border-border/70 bg-card/60 backdrop-blur h-fit lg:sticky lg:top-24">
                <CardHeader className="py-4 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {selectedDay
                        ? `${MONTHS[cursor.month]} ${selectedDay}, ${cursor.year}`
                        : "Select a day"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {selectedDay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      onClick={() => setSelectedDay(null)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  {selectedEvents.length === 0 ? (
                    <div className="py-12 px-5 text-center">
                      <CircleDot className="size-5 text-muted-foreground mx-auto" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        {selectedDay ? "Nothing logged on this day." : "Click a day to see its events."}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {selectedEvents.map((e) => {
                        const m = kindMeta[e.kind];
                        const Icon = m.icon;
                        return (
                          <li key={e.id} className="px-5 py-4 flex gap-3">
                            <div
                              className={cn(
                                "size-9 rounded-lg grid place-items-center ring-1 shrink-0",
                                m.bg,
                                m.ring,
                              )}
                            >
                              <Icon className={cn("size-4", m.tone)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={cn("h-5 text-[10px] border-border/70", m.tone)}>
                                  {m.label}
                                </Badge>
                                {e.symbol && (
                                  <span className="text-sm font-medium tracking-tight">{e.symbol}</span>
                                )}
                                {e.time && (
                                  <span className="ml-auto text-[11px] text-muted-foreground tabular inline-flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {e.time}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{e.title}</p>
                              <div className="mt-1.5 flex items-center gap-3">
                                {typeof e.pnl === "number" && (
                                  <span
                                    className={cn(
                                      "text-xs tabular font-medium",
                                      e.pnl >= 0 ? "text-emerald-400" : "text-destructive",
                                    )}
                                  >
                                    {e.pnl >= 0 ? "+" : ""}
                                    {fmtInr(e.pnl)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* TIMELINE VIEW */
            <Card className="border-border/70 bg-card/60 backdrop-blur">
              <CardHeader className="py-4">
                <CardTitle className="text-base">
                  Timeline · {MONTHS[cursor.month]} {cursor.year}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {visibleEvents.length} events grouped by day
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <ol className="relative">
                  {Array.from(byDay.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([day, list]) => (
                      <li
                        key={day}
                        className="relative grid grid-cols-[120px_1fr] gap-6 px-6 py-5 border-b border-border/60 last:border-0"
                      >
                        <div className="text-right">
                          <div className="font-display text-2xl tabular">
                            {String(day).padStart(2, "0")}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            {MONTHS[cursor.month].slice(0, 3)} ·{" "}
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                              new Date(cursor.year, cursor.month, day).getDay()
                            ]}
                          </div>
                          {(() => {
                            const dp = list.reduce((s, e) => s + (e.pnl ?? 0), 0);
                            return dp !== 0 ? (
                              <div
                                className={cn(
                                  "mt-2 text-xs tabular font-medium",
                                  dp >= 0 ? "text-emerald-400" : "text-destructive",
                                )}
                              >
                                {dp >= 0 ? "+" : ""}
                                {fmtInr(dp)}
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <div className="relative border-l border-border/60 pl-6 space-y-3">
                          {list.map((e) => {
                            const m = kindMeta[e.kind];
                            const Icon = m.icon;
                            return (
                              <div
                                key={e.id}
                                className="relative rounded-lg border border-border/70 bg-background/50 px-4 py-3"
                              >
                                <span
                                  className={cn(
                                    "absolute -left-[33px] top-3 size-3 rounded-full ring-4 ring-background",
                                    m.dot,
                                  )}
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className={cn("size-7 rounded-md grid place-items-center ring-1", m.bg, m.ring)}>
                                    <Icon className={cn("size-3.5", m.tone)} />
                                  </div>
                                  <Badge variant="outline" className={cn("h-5 text-[10px] border-border/70", m.tone)}>
                                    {m.label}
                                  </Badge>
                                  {e.symbol && (
                                    <span className="text-sm font-medium tracking-tight">{e.symbol}</span>
                                  )}
                                  {e.time && (
                                    <span className="ml-auto text-[11px] text-muted-foreground tabular inline-flex items-center gap-1">
                                      <Clock className="size-3" />
                                      {e.time}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1.5 text-sm text-muted-foreground">{e.title}</p>
                                {typeof e.pnl === "number" && (
                                  <div className="mt-1.5 flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "text-xs tabular font-medium",
                                        e.pnl >= 0 ? "text-emerald-400" : "text-destructive",
                                      )}
                                    >
                                      {e.pnl >= 0 ? "+" : ""}
                                      {fmtInr(e.pnl)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  {visibleEvents.length === 0 && (
                    <li className="py-16 text-center text-sm text-muted-foreground">
                      Nothing to show with the current filters.
                    </li>
                  )}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- small kpi ---------- */

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof CalendarDays;
  tone: string;
}) {
  return (
    <Card className="border-border/70 bg-card/60 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
          <Icon className={cn("size-4", tone)} />
        </div>
        <div className={cn("mt-3 font-display text-2xl tabular tracking-tight", tone)}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}
