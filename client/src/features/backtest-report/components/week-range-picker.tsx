import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface WeekRange {
  from: Date;
  to: Date;
}

const fmtShort = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtLong = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const oneDay = 24 * 60 * 60 * 1000;

/** Prev/next arrows shift the whole window by its own span; the calendar
 * popover picks either a single date (from === to, one week) or a from/to
 * range — one control instead of separate single-date and range pickers. */
export function WeekRangePicker({ range, onChange }: { range: WeekRange; onChange: (r: WeekRange) => void }) {
  const spanMs = range.to.getTime() - range.from.getTime() + oneDay;

  const shift = (dir: 1 | -1) => {
    onChange({
      from: new Date(range.from.getTime() + dir * spanMs),
      to: new Date(range.to.getTime() + dir * spanMs),
    });
  };

  const single = isSameDay(range.from, range.to);
  const label = single ? `Week of ${fmtLong(range.from)}` : `${fmtShort(range.from)} → ${fmtShort(range.to)}`;

  return (
    <div className="flex items-center rounded-xl border border-border/70 bg-card/60 backdrop-blur">
      <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Previous window">
        <ChevronLeft className="size-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="min-w-[240px] font-medium">
            <CalendarDays className="size-4" /> {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={{ from: range.from, to: range.to } as DateRange}
            onSelect={(r) => {
              if (!r?.from) return;
              onChange({ from: r.from, to: r.to ?? r.from });
            }}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Next window">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
