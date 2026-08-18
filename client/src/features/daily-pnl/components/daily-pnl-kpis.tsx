import { Activity, Banknote, TrendingUp, Wallet } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { fmtSigned, fmtMoney } from "./daily-pnl-format";
import type { DailyPnlSnapshot } from "../types/daily-pnl.types";

export function DailyPnlKpis({ snapshot }: { snapshot: DailyPnlSnapshot }) {
  const kpis = [
    {
      icon: TrendingUp,
      label: "Total P&L today",
      value: fmtSigned(snapshot.totalPnl),
      positive: snapshot.totalPnl >= 0,
      foot: `${snapshot.openPositions.length} open · ${snapshot.closedToday.length} closed today`,
      accent: true,
    },
    {
      icon: Activity,
      label: "Unrealized P&L",
      value: fmtSigned(snapshot.unrealizedPnlTotal),
      positive: snapshot.unrealizedPnlTotal >= 0,
      foot: "mark-to-market, open positions",
    },
    {
      icon: Wallet,
      label: "Realized P&L today",
      value: fmtSigned(snapshot.realizedPnlTotal),
      positive: snapshot.realizedPnlTotal >= 0,
      foot: "trades closed today",
    },
    {
      icon: Banknote,
      label: "Available cash",
      value: fmtMoney(snapshot.availableCash),
      positive: snapshot.availableCash >= 0,
      foot: "at last sync",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} {...k} />
      ))}
    </div>
  );
}
