import { useMemo } from "react";
import { Layers, ListChecks, TrendingUp, Wallet, Zap } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { useLatestDailySignal } from "@/features/algo-signals/hooks/use-algo-signals";
import { fmtINR } from "../utils/journal-utils";
import type { JournalTrade } from "../types/journal.types";

export function OpenPositionsKpis({
  trades,
}: {
  trades: JournalTrade[];
}) {
  const { data: signal } = useLatestDailySignal();

  const k = useMemo(() => {
    let deployed = 0;
    let priced = 0;
    let unrealizedPnl = 0;
    let pricedDeployed = 0;

    for (const t of trades) {
      const capital = t.entry.entryPrice * t.entry.quantity;
      deployed += capital;
      if (t.markPrice != null) {
        priced++;
        pricedDeployed += capital;
        const long = t.entry.direction !== "SHORT";
        const pnlPerShare = long
          ? t.markPrice - t.entry.entryPrice
          : t.entry.entryPrice - t.markPrice;
        unrealizedPnl += pnlPerShare * t.entry.quantity;
      }
    }

    return {
      deployed,
      priced,
      unrealizedPnl,
      unrealizedPct: pricedDeployed > 0 ? (unrealizedPnl / pricedDeployed) * 100 : 0,
      needsReview: trades.filter((t) => t.needsReview).length,
    };
  }, [trades]);

  const maxPositions = signal?.max_positions;
  const freeSlots =
    maxPositions != null ? Math.max(maxPositions - trades.length, 0) : null;
  const pnlPositive = k.unrealizedPnl >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard
        icon={ListChecks}
        label="Open positions"
        value={String(trades.length)}
        positive
        foot={k.needsReview > 0 ? `${k.needsReview} to review` : "all reviewed"}
      />
      <KpiCard
        icon={Wallet}
        label="Capital deployed"
        value={fmtINR(k.deployed)}
        positive
        foot="at entry price"
      />
      <KpiCard
        icon={TrendingUp}
        label="Unrealised P&L"
        value={`${pnlPositive ? "+" : ""}${fmtINR(k.unrealizedPnl)}`}
        delta={`${k.unrealizedPct >= 0 ? "+" : ""}${k.unrealizedPct.toFixed(2)}%`}
        positive={pnlPositive}
        foot="vs capital deployed"
        accent
      />
      {maxPositions != null && (
        <KpiCard
          icon={Zap}
          label="Free slots"
          value={String(freeSlots)}
          positive
          foot={`of ${maxPositions} max`}
        />
      )}
      <KpiCard
        icon={Layers}
        label="Positions priced"
        value={`${k.priced}/${trades.length}`}
        positive={k.priced === trades.length}
        foot={k.priced === trades.length ? "all have a live mark" : "some untracked by phalanx"}
      />
    </div>
  );
}
