import { useMemo } from "react";
import { ListChecks, ShieldAlert, Target, Wallet } from "lucide-react";
import { JournalKpiCard } from "./journal-kpi-card";
import { deriveEntryMetrics, fmtINR } from "../utils/journal-utils";
import type { JournalTrade } from "../types/journal.types";

export function OpenPositionsKpis({
  trades,
  capital,
}: {
  trades: JournalTrade[];
  capital: number;
}) {
  const k = useMemo(() => {
    let deployed = 0;
    let atRisk = 0;
    for (const t of trades) {
      const m = deriveEntryMetrics(
        {
          direction: t.entry.direction,
          entryPrice: t.entry.entryPrice,
          stopPrice: t.entry.stopPrice,
          targetPrice: t.entry.targetPrice,
          quantity: t.entry.quantity,
          atr14: t.entry.atr14,
        },
        capital,
      );
      deployed += m.capitalDeployed;
      atRisk += m.capitalAtRisk ?? 0;
    }
    return {
      deployed,
      atRisk,
      gttPending: trades.filter((t) => !t.gttPlaced).length,
      needsReview: trades.filter((t) => t.needsReview).length,
    };
  }, [trades, capital]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <JournalKpiCard
        label="Open positions"
        value={String(trades.length)}
        hint={`${k.needsReview} to review`}
        icon={<ListChecks className="size-3.5 text-primary" />}
      />
      <JournalKpiCard
        label="Capital deployed"
        value={fmtINR(k.deployed)}
        hint="At entry price"
        icon={<Wallet className="size-3.5 text-primary" />}
      />
      <JournalKpiCard
        label="Capital at risk"
        value={fmtINR(k.atRisk)}
        hint="Entry → stop-loss"
        tone="bad"
        icon={<ShieldAlert className="size-3.5 text-primary" />}
      />
      <JournalKpiCard
        label="GTT pending"
        value={String(k.gttPending)}
        hint="Target/SL not yet placed"
        icon={<Target className="size-3.5 text-primary" />}
      />
    </div>
  );
}
