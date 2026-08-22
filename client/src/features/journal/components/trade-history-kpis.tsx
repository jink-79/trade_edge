import { useMemo } from "react";
import { Activity, Percent, Receipt, Scale, Wallet } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { deriveExitMetrics, fmtSignedINR, fmtINR } from "../utils/journal-utils";
import type { JournalTrade } from "../types/journal.types";

export function metricsFor(t: JournalTrade) {
  if (!t.exit) return null;
  return deriveExitMetrics(t.entry, {
    exitPrice: t.exit.exitPrice,
    exitDate: t.exit.exitDate,
  });
}

/** Net P&L when the backend computed it (charges-aware); falls back to the
 * gross figure for trades closed before charges tracking existed. */
function netPnlFor(t: JournalTrade, gross: number): number {
  return t.exit?.netPnlAmount ?? gross;
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
    let totalCharges = 0;
    for (const t of trades) {
      const m = metricsFor(t);
      if (!m) continue;
      const netPnl = netPnlFor(t, m.realizedPnl);
      net += netPnl;
      invested += t.entry.entryPrice * t.entry.quantity;
      if (netPnl >= 0) wins++;
      if (netPnl >= 0) grossProfit += netPnl;
      else grossLoss += Math.abs(netPnl);
      if (m.rMultiple != null) {
        rSum += m.rMultiple;
        rCount++;
      }
      holdSum += m.daysHeld;
      holdCount++;
      totalCharges += t.exit?.charges?.totalCharges ?? 0;
    }
    return {
      net,
      netPct: invested > 0 ? (net / invested) * 100 : 0,
      winRate: trades.length ? (wins / trades.length) * 100 : 0,
      avgR: rCount ? rSum / rCount : null,
      profitFactor:
        grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      avgHold: holdCount ? Math.round(holdSum / holdCount) : 0,
      totalCharges,
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
      foot: "realised, net of charges",
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
      icon: Scale,
      label: "Profit Factor",
      value: Number.isFinite(k.profitFactor) ? k.profitFactor.toFixed(2) : "∞",
      positive: k.profitFactor >= 1,
      foot: "gains / losses",
    },
    {
      icon: Receipt,
      label: "Total Charges",
      value: fmtINR(k.totalCharges),
      positive: false,
      foot: "STT, exchange, SEBI, stamp, DP, GST",
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
