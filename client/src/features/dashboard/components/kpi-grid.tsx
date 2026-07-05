import {
  Activity,
  Briefcase,
  Layers,
  Percent,
  Target,
  Wallet,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { fmtINR } from "@/lib/positions-utils";
import type {
  DashboardPortfolio,
  DashboardPositions,
  DashboardTradeStats,
} from "../types/dashboard.types";

interface KpiGridProps {
  stats: DashboardTradeStats;
  portfolio: DashboardPortfolio;
  positions: DashboardPositions;
}

export function KpiGrid({ stats, portfolio, positions }: KpiGridProps) {
  const pnlPos = stats.netPnl >= 0;

  const kpis = [
    {
      icon: Wallet,
      label: "Net P&L",
      value: `${pnlPos ? "+" : ""}${fmtINR(stats.netPnl)}`,
      positive: pnlPos,
      foot: "realised, all-time",
      accent: true,
    },
    {
      icon: Activity,
      label: "Total Trades",
      value: String(stats.totalTrades),
      positive: true,
      foot: `avg hold ${stats.avgHold}`,
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      positive: stats.winRate >= 50,
      foot: "of closed trades",
      progress: Math.round(stats.winRate),
    },
    {
      icon: Layers,
      label: "Open Positions",
      value: String(positions.openCount),
      positive: true,
      foot: `${fmtINR(positions.totalInvested)} deployed`,
    },
    {
      icon: Briefcase,
      label: "Portfolio Value",
      value: fmtINR(portfolio.totalValue),
      positive: true,
      foot: `${fmtINR(portfolio.totalMfInvested)} in MFs`,
    },
    {
      icon: Target,
      label: "Profit Factor",
      value: stats.profitFactor.toFixed(2),
      positive: stats.profitFactor >= 1,
      foot: "gains / losses",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} {...k} />
      ))}
    </div>
  );
}
