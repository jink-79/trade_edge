import { AlgoSignalsKpis } from "./algo-signals-kpis";
import { AlgoSignalsExits } from "./algo-signals-exits";
import { AlgoSignalsCandidates } from "./algo-signals-candidates";
import { AlgoSignalsStale } from "./algo-signals-stale";
import type { DailySignalDoc } from "../types/algo-signals.types";

export function AlgoSignalsDailyView({ doc }: { doc: DailySignalDoc }) {
  return (
    <div className="space-y-6">
      <AlgoSignalsKpis doc={doc} />
      <AlgoSignalsExits exits={doc.exits ?? []} />
      <AlgoSignalsCandidates
        candidates={(doc.buy_candidates_ranked ?? []).map((c) => ({
          symbol: c.symbol,
          metricPct: c.rs55_pct,
        }))}
        freeSlots={doc.free_slots_after_exits ?? 0}
        sized={doc.to_buy_sized}
        metricLabel="RS-55"
      />
      <AlgoSignalsStale symbols={doc.stale_symbols ?? []} />
    </div>
  );
}
