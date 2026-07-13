import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WeeklySignal } from "../types/signals.types";

interface WeekSelectorProps {
  weeks: WeeklySignal[];
  selectedWeek: string;
  onChange: (week: string) => void;
}

/** "2026-05-11" or an ISO string → "11 May 2026" */
export function weekLabel(w: WeeklySignal): string {
  const raw = w.week ?? w.signalWeek;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw ?? "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function keyOf(w: WeeklySignal): string {
  return w.week ?? w.signalWeek;
}

export function WeekSelector({
  weeks,
  selectedWeek,
  onChange,
}: WeekSelectorProps) {
  const currentIdx = weeks.findIndex((w) => keyOf(w) === selectedWeek);

  const goPrev = () => {
    if (currentIdx < weeks.length - 1) onChange(keyOf(weeks[currentIdx + 1]));
  };
  const goNext = () => {
    if (currentIdx > 0) onChange(keyOf(weeks[currentIdx - 1]));
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          onClick={goPrev}
          disabled={currentIdx >= weeks.length - 1}
          className="size-8 rounded-lg border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={goNext}
          disabled={currentIdx <= 0}
          className="size-8 rounded-lg border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {weeks.map((w, i) => {
          const k = keyOf(w);
          const isSelected = k === selectedWeek;
          const isLatest = i === 0;
          return (
            <button
              key={k}
              onClick={() => onChange(k)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                isSelected
                  ? "bg-primary/15 text-primary border-primary/40 ring-1 ring-primary/30"
                  : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border hover:bg-accent/30"
              }`}
            >
              <span>{weekLabel(w)}</span>
              <span
                className={`tabular text-[10px] px-1 rounded ${
                  isSelected ? "text-primary/80" : "text-muted-foreground/60"
                }`}
              >
                {w.count}
              </span>
              {isLatest && isSelected && (
                <span className="absolute -top-1.5 -right-1.5 text-[8px] uppercase tracking-wider bg-primary text-primary-foreground px-1 rounded-sm font-bold leading-tight">
                  latest
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
