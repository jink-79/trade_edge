import { CircleDot, Layers, Percent, ShieldX, Target, Trophy } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import type { ScannerStats } from "../types/scanner.types";

export function ScannerKpis({ stats }: { stats: ScannerStats }) {
  const kpis = [
    {
      icon: Layers,
      label: "Tracking",
      value: String(stats.total),
      positive: true,
      foot: `${stats.open} open · ${stats.resolved} resolved`,
      accent: true,
    },
    {
      icon: Target,
      label: "Hit Target",
      value: `${stats.targetPct.toFixed(1)}%`,
      positive: true,
      foot: "of resolved",
      progress: Math.round(stats.targetPct),
    },
    {
      icon: ShieldX,
      label: "Hit Stop",
      value: `${stats.stopPct.toFixed(1)}%`,
      positive: false,
      foot: "of resolved",
      progress: Math.round(stats.stopPct),
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      positive: stats.winRate >= 50,
      foot: `${stats.timeoutPct.toFixed(0)}% timed out`,
    },
    {
      icon: stats.avgR != null && stats.avgR >= 0 ? Trophy : CircleDot,
      label: "Avg R",
      value:
        stats.avgR != null
          ? `${stats.avgR >= 0 ? "+" : ""}${stats.avgR.toFixed(2)}R`
          : "—",
      positive: (stats.avgR ?? 0) >= 0,
      foot: `avg ${stats.avgDaysToResolve.toFixed(0)}d to resolve`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} {...k} />
      ))}
    </div>
  );
}
