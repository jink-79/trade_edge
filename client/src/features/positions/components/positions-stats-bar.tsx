import {
  AlertTriangle,
  BarChart2,
  Clock,
  DollarSign,
  Layers,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { PositionsSummary } from "../types/positions.types";
import { fmtINR } from "@/lib/positions-utils";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  positive,
  accent = false,
  iconColor = "text-muted-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  positive?: boolean;
  accent?: boolean;
  iconColor?: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-border/70 bg-card/70 backdrop-blur-sm ${accent ? "ring-1 ring-primary/30" : ""}`}
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
        {sub && (
          <p
            className={`text-xs ${
              positive === true
                ? "text-primary"
                : positive === false
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface PositionsStatsBarProps {
  summary: PositionsSummary;
  positionCount: number;
}

export function PositionsStatsBar({
  summary,
  positionCount,
}: PositionsStatsBarProps) {
  const {
    totalPnl,
    totalPnlPct,
    totalInvested,
    winners,
    losers,
    trailCount,
    signalCount,
    avgHold,
  } = summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={DollarSign}
        label="Unrealised P&L"
        value={`${totalPnl >= 0 ? "+" : ""}${fmtINR(Math.abs(totalPnl))}`}
        sub={`${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}% on deployed`}
        positive={totalPnl >= 0}
        accent
        iconColor="text-primary"
      />
      <StatCard
        icon={Layers}
        label="Positions"
        value={positionCount}
        sub={`${winners} winning · ${losers} losing`}
        iconColor="text-chart-2"
      />
      <StatCard
        icon={BarChart2}
        label="Deployed"
        value={`₹${(totalInvested / 100000).toFixed(1)}L`}
        sub="total capital at work"
        iconColor="text-chart-3"
      />
      <StatCard
        icon={Shield}
        label="Trailing"
        value={trailCount}
        sub="positions with trail active"
        iconColor="text-primary"
      />
      <StatCard
        icon={AlertTriangle}
        label="Exit Signals"
        value={signalCount}
        sub={signalCount > 0 ? "review immediately" : "all clear"}
        positive={signalCount === 0}
        iconColor={
          signalCount > 0 ? "text-destructive" : "text-muted-foreground"
        }
      />
      <StatCard
        icon={Clock}
        label="Avg Hold"
        value={`${avgHold}d`}
        sub="average holding days"
        iconColor="text-chart-5"
      />
    </div>
  );
}
