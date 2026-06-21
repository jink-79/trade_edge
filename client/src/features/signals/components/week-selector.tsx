import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { WeekMeta } from "../types/signals.types";

interface WeekSelectorProps {
  weeks: WeekMeta[];
  selectedWeek: string;
  onChange: (week: string) => void;
}

export function WeekSelector({
  weeks,
  selectedWeek,
  onChange,
}: WeekSelectorProps) {
  const currentIdx = weeks.findIndex((w) => w.weekStart === selectedWeek);

  const goPrev = () => {
    if (currentIdx < weeks.length - 1)
      onChange(weeks[currentIdx + 1].weekStart);
  };
  const goNext = () => {
    if (currentIdx > 0) onChange(weeks[currentIdx - 1].weekStart);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Arrow nav */}
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

      {/* Week pill strip */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {weeks.map((w) => {
          const isSelected = w.weekStart === selectedWeek;
          const isLatest = w.weekStart === weeks[0].weekStart;
          return (
            <button
              key={w.weekStart}
              onClick={() => onChange(w.weekStart)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                isSelected
                  ? "bg-primary/15 text-primary border-primary/40 ring-1 ring-primary/30"
                  : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border hover:bg-accent/30"
              }`}
            >
              {/* Nifty filter indicator dot */}
              <span
                className={`size-1.5 rounded-full shrink-0 ${
                  w.niftyAboveEma ? "bg-primary" : "bg-destructive"
                }`}
              />
              <span className="hidden sm:inline">{w.weekLabel}</span>
              <span className="sm:hidden">{w.weekStart.slice(5, 10)}</span>
              <span
                className={`tabular text-[10px] px-1 rounded ${
                  isSelected ? "text-primary/80" : "text-muted-foreground/60"
                }`}
              >
                {w.signalCount}
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

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground ml-auto shrink-0">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary" /> Nifty above EMA
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-destructive" /> Below EMA
        </span>
      </div>
    </div>
  );
}
