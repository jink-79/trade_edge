import { Activity, BarChart3, Gauge, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { EnrichedSignal } from "../types/signals.types";

interface SignalStatsBarProps {
  signals: EnrichedSignal[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
  iconColor = "text-muted-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
  iconColor?: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-border/70 bg-card/70 backdrop-blur-sm ${
        accent ? "ring-1 ring-primary/30" : ""
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {accent && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, oklch(0.78 0.17 155 / 18%), transparent 60%)",
          }}
        />
      )}
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] uppercase tracking-[0.16em]">
            {label}
          </CardDescription>
          <div
            className="size-7 rounded-md grid place-items-center ring-1 ring-border/70"
            style={{ background: "oklch(0.3 0.04 250)" }}
          >
            <Icon className={`size-3.5 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-1.5">
        <div className="text-2xl font-semibold tabular tracking-tight">
          {value}
        </div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function SignalStatsBar({ signals }: SignalStatsBarProps) {
  const strong = signals.filter((s) => s.strength === "strong").length;
  const moderate = signals.filter((s) => s.strength === "moderate").length;
  const weak = signals.filter((s) => s.strength === "weak").length;

  const avgVol =
    signals.length > 0
      ? signals.reduce((s, x) => s + x.volumeRatio, 0) / signals.length
      : 0;
  const maxVol = signals.reduce((m, x) => Math.max(m, x.volumeRatio), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Zap}
        label="Total Signals"
        value={signals.length}
        sub="breakouts this week"
        accent
        iconColor="text-primary"
      />
      <StatCard
        icon={Activity}
        label="Signal Quality"
        value={
          <span className="flex items-baseline gap-1.5">
            <span className="text-primary">{strong}</span>
            <span className="text-lg text-muted-foreground">/</span>
            <span className="text-[oklch(0.82_0.16_85)]">{moderate}</span>
            <span className="text-lg text-muted-foreground">/</span>
            <span className="text-muted-foreground">{weak}</span>
          </span>
        }
        sub="strong / moderate / weak"
        iconColor="text-chart-2"
      />
      <StatCard
        icon={Gauge}
        label="Avg Volume"
        value={`${avgVol.toFixed(2)}x`}
        sub="of 20-week average"
        iconColor="text-chart-3"
      />
      <StatCard
        icon={BarChart3}
        label="Peak Volume"
        value={`${maxVol.toFixed(2)}x`}
        sub="strongest surge"
        iconColor="text-chart-5"
      />
    </div>
  );
}
