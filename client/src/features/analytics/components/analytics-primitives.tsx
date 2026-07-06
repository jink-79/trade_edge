/* ─────────────────────────────────────────────
   Shared primitives used across analytics
   components. Not a page component itself.
───────────────────────────────────────────── */

export const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export const CHART_STYLE = {
  tooltip: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
  },
  grid: { stroke: "var(--border)", strokeDasharray: "3 6" },
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
} as const;

import { Card, CardContent } from "@/components/ui/card";

export function KpiTile({
  icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <Card className="border-border/70 bg-card/60 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-7 rounded-md grid place-items-center bg-accent/50 ring-1 ring-border/60 text-foreground">
            {icon}
          </div>
          <span className="text-[11px] uppercase tracking-[0.14em]">
            {label}
          </span>
        </div>
        <div
          className="mt-3 text-2xl tabular font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </div>
        <div
          className={`mt-1 text-[11px] tabular ${positive ? "text-primary" : "text-destructive"}`}
        >
          {delta}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── LegendDot ── */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

/* ── MicroStat ── */
export function MicroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "primary" | "destructive";
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-base tabular font-semibold ${
          accent === "primary"
            ? "text-primary"
            : accent === "destructive"
              ? "text-destructive"
              : "text-foreground"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Insight ── */
export function Insight({
  tone,
  icon,
  title,
  body,
}: {
  tone: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const ring =
    tone === "positive"
      ? "ring-primary/30 bg-primary/5"
      : tone === "negative"
        ? "ring-destructive/30 bg-destructive/5"
        : "ring-border/60 bg-accent/30";
  const dot =
    tone === "positive"
      ? "bg-primary/15 text-primary"
      : tone === "negative"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted/40 text-foreground";
  return (
    <div className={`flex gap-3 rounded-lg p-3 ring-1 ${ring}`}>
      <div
        className={`size-7 rounded-md grid place-items-center shrink-0 ${dot}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-snug">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  );
}
