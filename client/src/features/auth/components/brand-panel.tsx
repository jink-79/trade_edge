import {
  Activity,
  BarChart3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const equity = [
  { v: 100 },
  { v: 104 },
  { v: 102 },
  { v: 110 },
  { v: 116 },
  { v: 113 },
  { v: 122 },
  { v: 128 },
  { v: 126 },
  { v: 134 },
  { v: 141 },
  { v: 138 },
  { v: 149 },
  { v: 156 },
  { v: 162 },
];

const proofStats = [
  { label: "Win rate", value: "63.4%", icon: TrendingUp },
  { label: "Profit factor", value: "2.18", icon: Activity },
  { label: "Avg R", value: "1.74", icon: BarChart3 },
];

export function BrandPanel() {
  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/60 p-10">
      {/* backgrounds */}
      <div
        className="absolute inset-0 -z-10 opacity-90"
        style={{ background: "var(--gradient-surface)" }}
      />
      <div
        className="absolute -top-32 -left-24 size-105 rounded-full -z-10 blur-3xl opacity-50"
        style={{ background: "var(--gradient-success)" }}
      />
      <div
        className="absolute -bottom-40 -right-20 size-115 rounded-full -z-10 blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, oklch(0.68 0.18 240 / 60%), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* logo */}
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
          <Zap className="size-4 text-primary" />
        </div>
        <div className="leading-tight">
          <div
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Trade Edge
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Performance OS
          </div>
        </div>
      </div>

      {/* headline + chart card */}
      <div className="max-w-md space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="size-3 text-primary" />
          Built for serious traders
        </div>
        <h1
          className="text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          The journal that <span className="text-primary">finds your edge</span>{" "}
          before the market does.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Log every entry, replay every exit. Trade Edge turns raw fills into
          playbooks, risk profiles, and the patterns that actually move your
          curve.
        </p>

        {/* equity card */}
        <div
          className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Equity curve · YTD
              </div>
              <div
                className="text-2xl mt-1 tabular font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                +62.4%
              </div>
            </div>
            <div className="text-xs text-primary tabular">▲ 8.1% this wk</div>
          </div>
          <div className="h-24 mt-3 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={equity}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="loginEq" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.55}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#loginEq)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {proofStats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <s.icon className="size-3" />
                  {s.label}
                </div>
                <div
                  className="text-lg mt-1 tabular font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-primary" />
          Bank-grade encryption · SOC 2 ready
        </div>
        <div>© {new Date().getFullYear()} Trade Edge</div>
      </div>
    </aside>
  );
}
