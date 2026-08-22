import { Activity, Banknote, CheckCircle2, Layers, TrendingUp } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { fmtSigned, fmtMoney } from "./daily-pnl-format";
import type { DailyPnlSnapshot } from "../types/daily-pnl.types";

export function DailyPnlKpis({ snapshot }: { snapshot: DailyPnlSnapshot }) {
  const kpis = [
    {
      icon: TrendingUp,
      label: "Today's P&L",
      value: fmtSigned(snapshot.totalPnl),
      positive: snapshot.totalPnl >= 0,
      foot: "today's move + today's exits",
      accent: true,
    },
    {
      icon: Activity,
      label: "Realized today",
      value: fmtSigned(snapshot.realizedPnlTotal),
      positive: snapshot.realizedPnlTotal >= 0,
      foot: "trades closed today",
    },
    {
      icon: TrendingUp,
      label: "Unrealized (since entry)",
      value: fmtSigned(snapshot.unrealizedPnlTotal),
      positive: snapshot.unrealizedPnlTotal >= 0,
      foot: "all open positions, all-time",
    },
    {
      icon: Banknote,
      label: "Available cash",
      value: fmtMoney(snapshot.availableCash),
      positive: snapshot.availableCash >= 0,
      foot: "funds ledger − deployed + realized",
    },
    {
      icon: Layers,
      label: "Open positions",
      value: String(snapshot.openPositions.length),
      positive: true,
      foot: "currently held",
    },
    {
      icon: CheckCircle2,
      label: "Closed today",
      value: String(snapshot.closedToday.length),
      positive: true,
      foot: "trades exited today",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} {...k} />
      ))}
    </div>
  );
}
