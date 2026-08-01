import { Activity, Gauge, Percent, Scale, TrendingDown, Wallet } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { fmtPct, fmtNum } from "./pulse-format";
import type { PulseMetrics } from "../types/pulse.types";

export function PulseKpis({ m }: { m: PulseMetrics }) {
  const cagrPos = (m.cagrPct ?? 0) >= 0;
  const alphaPos = (m.alphaPct ?? 0) >= 0;

  const kpis = [
    {
      icon: Wallet,
      label: "CAGR",
      value: fmtPct(m.cagrPct),
      delta: m.alphaPct != null ? `${m.alphaPct.toFixed(1)}pp α` : undefined,
      positive: cagrPos && alphaPos,
      foot: `Nifty ${fmtPct(m.niftyCagrPct)}`,
      accent: true,
    },
    {
      icon: Activity,
      label: "Total Return",
      value: fmtPct(m.returnPct),
      positive: (m.returnPct ?? 0) >= 0,
      foot: `${m.trades ?? 0} trades`,
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: fmtPct(m.winRatePct),
      positive: (m.winRatePct ?? 0) >= 50,
      foot: `expectancy ${fmtPct(m.expectancyPct)}`,
      progress: m.winRatePct != null ? Math.round(m.winRatePct) : undefined,
    },
    {
      icon: Gauge,
      label: "Sharpe",
      value: fmtNum(m.sharpe),
      positive: (m.sharpe ?? 0) >= 1,
      foot: `Sortino ${fmtNum(m.sortino)}`,
    },
    {
      icon: TrendingDown,
      label: "Max Drawdown",
      value: fmtPct(m.maxDrawdownPct),
      positive: false,
      foot: `${m.maxDrawdownWeeks ?? 0}w longest`,
    },
    {
      icon: Scale,
      label: "Profit Factor",
      value: fmtNum(m.profitFactor),
      positive: (m.profitFactor ?? 0) >= 1,
      foot: `Calmar ${fmtNum(m.calmar)}`,
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
