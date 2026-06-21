import {
  Activity,
  ShieldCheck,
  ShieldOff,
  TrendingUp,
  Zap,
  ScanLine,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { SignalsWeekResponse } from "../types/signals.types";

interface SignalStatsBarProps {
  response: SignalsWeekResponse;
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

export function SignalStatsBar({ response }: SignalStatsBarProps) {
  const {
    data: signals,
    niftyAboveEma,
    niftyClose,
    niftyEma20w,
    totalScanned,
  } = response;

  const strong = signals.filter((s) => s.strength === "strong").length;
  const moderate = signals.filter((s) => s.strength === "moderate").length;
  const weak = signals.filter((s) => s.strength === "weak").length;
  const niftyGap = (((niftyClose - niftyEma20w) / niftyEma20w) * 100).toFixed(
    2,
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard
        icon={Zap}
        label="Total Signals"
        value={signals.length}
        sub={`from ${totalScanned} symbols scanned`}
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
        icon={ScanLine}
        label="Hit Rate"
        value={`${((signals.length / totalScanned) * 100).toFixed(1)}%`}
        sub={`${signals.length} of ${totalScanned} qualified`}
        iconColor="text-chart-3"
      />
      <StatCard
        icon={niftyAboveEma ? ShieldCheck : ShieldOff}
        label="Nifty Filter"
        value={
          <span className={niftyAboveEma ? "text-primary" : "text-destructive"}>
            {niftyAboveEma ? "Active ✓" : "Off ✗"}
          </span>
        }
        sub={`${niftyGap}% above 20W EMA`}
        iconColor={niftyAboveEma ? "text-primary" : "text-destructive"}
      />
      <StatCard
        icon={TrendingUp}
        label="Nifty Close"
        value={niftyClose.toLocaleString("en-IN")}
        sub={`EMA₂₀W: ${niftyEma20w.toLocaleString("en-IN")}`}
        iconColor="text-chart-5"
      />
    </div>
  );
}
