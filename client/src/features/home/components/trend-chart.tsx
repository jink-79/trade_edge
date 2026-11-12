import { fmtINRShort, shortMonth } from "@/lib/format";
import type { MonthPoint } from "../utils/net-worth";

// Net worth over the last months: area + line, faint grid, latest point marked.
export function TrendChart({ points }: { points: MonthPoint[] }) {
  const W = 320;
  const H = 120;
  const top = 8;
  const bottom = 8;
  const values = points.map((p) => p.net);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= Math.abs(min) * 0.1 || 1;
    max += Math.abs(max) * 0.1 || 1;
  }
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => top + (1 - (v - min) / (max - min)) * (H - top - bottom);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.net).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const lx = (x(points.length - 1) / W) * 100;
  const ly = (y(last.net) / H) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* the line's highest point touches the top edge and its lowest the bottom */}
        <span className="absolute left-0 top-0 text-[11px] text-muted-foreground tabular-nums">
          {fmtINRShort(Math.max(...values))}
        </span>
        <span className="absolute bottom-0 left-0 text-[11px] text-muted-foreground tabular-nums">
          {fmtINRShort(Math.min(...values))}
        </span>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-32 w-full" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} className="stroke-border" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={`${line} L${W} ${H} L0 ${H} Z`} className="fill-primary/12" />
          <path d={line} className="fill-none stroke-primary" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* HTML dot so it stays round when the chart stretches */}
        <span
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/20"
          style={{ left: `${lx}%`, top: `${ly}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{shortMonth(points[0].month)}</span>
        {points.length > 4 && <span>{shortMonth(points[Math.floor((points.length - 1) / 2)].month)}</span>}
        <span>{shortMonth(last.month)}</span>
      </div>
    </div>
  );
}
