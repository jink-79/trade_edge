export function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/80 bg-popover/95 backdrop-blur-md px-3 py-2 shadow-xl">
      {label && (
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}</span>
          <span className="ml-auto tabular text-foreground">
            {prefix}
            {p.value.toLocaleString()}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
