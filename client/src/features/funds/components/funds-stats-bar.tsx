import { Wallet, Layers, TrendingUp, PiggyBank } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { FundsSummary, FundType } from "../types/funds.types";

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

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
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const TYPE_CFG: Record<
  FundType,
  { label: string; color: string; bar: string }
> = {
  trading: { label: "Trading", color: "text-primary", bar: "bg-primary" },
  savings: {
    label: "Savings",
    color: "text-[oklch(0.68_0.18_240)]",
    bar: "bg-[oklch(0.68_0.18_240)]",
  },
  emergency: {
    label: "Emergency",
    color: "text-[oklch(0.82_0.16_85)]",
    bar: "bg-[oklch(0.82_0.16_85)]",
  },
  other: {
    label: "Other",
    color: "text-muted-foreground",
    bar: "bg-muted-foreground/50",
  },
};

interface FundsStatsBarProps {
  summary: FundsSummary;
}

export function FundsStatsBar({ summary }: FundsStatsBarProps) {
  const tradingAmt = summary.byType.trading ?? 0;
  const savingsAmt = summary.byType.savings ?? 0;
  const emergencyAmt = summary.byType.emergency ?? 0;
//   const otherAmt = summary.byType.other ?? 0;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Funds"
          value={`₹${(summary.totalFunds / 100000).toFixed(2)}L`}
          sub={fmtINR(summary.totalFunds)}
          accent
          iconColor="text-primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Trading Capital"
          value={fmtINR(tradingAmt)}
          sub={`${summary.totalFunds > 0 ? ((tradingAmt / summary.totalFunds) * 100).toFixed(1) : 0}% of total`}
          iconColor="text-primary"
        />
        <StatCard
          icon={PiggyBank}
          label="Savings"
          value={fmtINR(savingsAmt + emergencyAmt)}
          sub="savings + emergency"
          iconColor="text-[oklch(0.68_0.18_240)]"
        />
        <StatCard
          icon={Layers}
          label="Entries"
          value={summary.totalEntries}
          sub="total fund records"
          iconColor="text-chart-5"
        />
      </div>

      {/* Allocation bar */}
      <Card
        className="border-border/70 bg-card/70"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            {/* Stacked bar */}
            <div className="flex-1 h-2.5 rounded-full overflow-hidden flex gap-px bg-secondary/40">
              {(["trading", "savings", "emergency", "other"] as FundType[]).map(
                (type) => {
                  const amt = summary.byType[type] ?? 0;
                  const pct =
                    summary.totalFunds > 0
                      ? (amt / summary.totalFunds) * 100
                      : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={type}
                      className={`h-full ${TYPE_CFG[type].bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                },
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 shrink-0">
              {(["trading", "savings", "emergency", "other"] as FundType[]).map(
                (type) => {
                  const amt = summary.byType[type] ?? 0;
                  const pct =
                    summary.totalFunds > 0
                      ? (amt / summary.totalFunds) * 100
                      : 0;
                  if (amt === 0) return null;
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className={`size-2 rounded-sm ${TYPE_CFG[type].bar}`}
                      />
                      <span className="text-muted-foreground">
                        {TYPE_CFG[type].label}
                      </span>
                      <span
                        className={`tabular font-medium ${TYPE_CFG[type].color}`}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
