interface Props {
  values: number[]; // oldest first
  className?: string;
}

// Small trend line with a soft fill and a dot on the latest value.
export function Sparkline({ values, className }: Props) {
  if (values.length < 2) return null;
  const w = 300;
  const h = 64;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    pad + (1 - (v - min) / span) * (h - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={`${line} L${w} ${h} L0 ${h} Z`} className="fill-primary/12" />
      <path d={line} className="fill-none stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r={3.5} className="fill-primary" />
    </svg>
  );
}
