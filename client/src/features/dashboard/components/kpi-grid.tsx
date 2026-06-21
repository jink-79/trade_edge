import { Activity, ArrowDownRight, Percent, Target, TrendingUp, Wallet } from "lucide-react";
import { KpiCard } from "./kpi-card";

export function KpiGrid() {
  const kpis = [
    {
      icon: Wallet,
      label: "Net P&L",
      value: "+$16,230",
      delta: "+18.4%",
      positive: true,
      foot: "vs. last quarter",
      accent: true,
    },
    {
      icon: Activity,
      label: "Total Trades",
      value: "284",
      delta: "+22",
      positive: true,
      foot: "this month",
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: "62.4%",
      delta: "+3.1%",
      positive: true,
      foot: "177W · 107L",
      progress: 62,
    },
    {
      icon: TrendingUp,
      label: "Avg Win",
      value: "+$184.20",
      delta: "+$12",
      positive: true,
      foot: "per winning trade",
    },
    {
      icon: ArrowDownRight,
      label: "Avg Loss",
      value: "-$96.40",
      delta: "-$4",
      positive: true,
      foot: "per losing trade",
    },
    {
      icon: Target,
      label: "Profit Factor",
      value: "2.18",
      delta: "+0.14",
      positive: true,
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