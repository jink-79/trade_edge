import {
  Activity,
  Gauge,
  Percent,
  Scale,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { fmtPct, fmtPctRaw, fmtNum } from "./performance-format";
import type { BacktestMetrics } from "../types/performance.types";

export function PerformanceKpis({ m }: { m: BacktestMetrics }) {
  const cagrPos = (m.cagr ?? 0) >= 0;
  const alphaPos = (m.alphaVsNifty ?? 0) >= 0;

  const kpis = [
    {
      icon: Wallet,
      label: "CAGR",
      value: fmtPct(m.cagr, true),
      delta: m.alphaVsNifty != null ? `${fmtPct(m.alphaVsNifty, true)} α` : undefined,
      positive: cagrPos && alphaPos,
      foot: `Nifty ${fmtPct(m.niftyCagr, true)}`,
      accent: true,
    },
    {
      icon: Activity,
      label: "Total Return",
      value: fmtPct(m.totalReturn, true),
      positive: (m.totalReturn ?? 0) >= 0,
      foot: `${m.totalTrades ?? 0} trades`,
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: fmtPctRaw(m.winRate),
      positive: (m.winRate ?? 0) >= 50,
      foot: `expectancy ${m.expectancyR != null ? m.expectancyR.toFixed(2) + "R" : "—"}`,
      progress: m.winRate != null ? Math.round(m.winRate) : undefined,
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
      value: fmtPct(m.maxDrawdown),
      positive: false,
      foot: `${m.maxDrawdownDurationDays ?? 0}d longest`,
    },
    {
      icon: Scale,
      label: "Profit Factor",
      value: fmtNum(m.profitFactor),
      positive: (m.profitFactor ?? 0) >= 1,
      foot: `R:R ${fmtNum(m.rr)}`,
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
