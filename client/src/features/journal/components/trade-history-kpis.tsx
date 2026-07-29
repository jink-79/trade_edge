import { useMemo } from "react";
import { Activity, Percent, Scale, Trophy, Wallet } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { deriveExitMetrics, fmtSignedINR } from "../utils/journal-utils";
import type { JournalTrade } from "../types/journal.types";

export function metricsFor(t: JournalTrade) {
  if (!t.exit) return null;
  return deriveExitMetrics(t.entry, {
    exitPrice: t.exit.exitPrice,
    exitDate: t.exit.exitDate,
  });
}

export function TradeHistoryKpis({ trades }: { trades: JournalTrade[] }) {
  const k = useMemo(() => {
    let net = 0;
    let invested = 0;
    let wins = 0;
    let rSum = 0;
    let rCount = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let holdSum = 0;
    let holdCount = 0;
    for (const t of trades) {
      const m = metricsFor(t);
      if (!m) continue;
      net += m.realizedPnl;
      invested += t.entry.entryPrice * t.entry.quantity;
      if (m.win) wins++;
      if (m.realizedPnl >= 0) grossProfit += m.realizedPnl;
      else grossLoss += Math.abs(m.realizedPnl);
      if (m.rMultiple != null) {
        rSum += m.rMultiple;
        rCount++;
      }
      holdSum += m.daysHeld;
      holdCount++;
    }
    return {
      net,
      netPct: invested > 0 ? (net / invested) * 100 : 0,
      winRate: trades.length ? (wins / trades.length) * 100 : 0,
      avgR: rCount ? rSum / rCount : null,
      profitFactor:
        grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      avgHold: holdCount ? Math.round(holdSum / holdCount) : 0,
    };
  }, [trades]);

  const netPos = k.net >= 0;

  const kpis = [
    {
      icon: Wallet,
      label: "Net P&L",
      value: fmtSignedINR(k.net),
      delta: `${k.netPct >= 0 ? "+" : ""}${k.netPct.toFixed(2)}%`,
      positive: netPos,
      foot: "realised, all-time",
      accent: true,
    },
    {
      icon: Activity,
      label: "Closed Trades",
      value: String(trades.length),
      positive: true,
      foot: `avg hold ${k.avgHold}d`,
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: `${k.winRate.toFixed(1)}%`,
      positive: k.winRate >= 50,
      foot: "of closed trades",
      progress: Math.round(k.winRate),
    },
    {
      icon: Trophy,
      label: "Avg R",
      value:
        k.avgR != null ? `${k.avgR >= 0 ? "+" : ""}${k.avgR.toFixed(2)}R` : "—",
      positive: (k.avgR ?? 0) >= 0,
      foot: "per closed trade",
    },
    {
      icon: Scale,
      label: "Profit Factor",
      value: Number.isFinite(k.profitFactor) ? k.profitFactor.toFixed(2) : "∞",
      positive: k.profitFactor >= 1,
      foot: "gains / losses",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
