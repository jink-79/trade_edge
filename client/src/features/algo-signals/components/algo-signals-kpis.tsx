import { CalendarDays, Layers, Target, Wallet } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { fmtMoney } from "./algo-signals-format";
import type { DailySignalDoc } from "../types/algo-signals.types";

export function AlgoSignalsKpis({ doc }: { doc: DailySignalDoc }) {
  const kpis = [
    {
      icon: CalendarDays,
      label: "Reference date",
      value: doc.reference_date?.slice(0, 10) ?? "—",
      positive: true,
      foot: `${doc.held_before?.length ?? 0} held before`,
      accent: true,
    },
    {
      icon: Wallet,
      label: "Capital",
      value: fmtMoney(doc.capital),
      positive: true,
      foot: `slot size ${fmtMoney(doc.slot_size)}`,
    },
    {
      icon: Layers,
      label: "Max positions",
      value: String(doc.max_positions ?? "—"),
      positive: (doc.exits?.length ?? 0) === 0,
      foot: `${doc.exits?.length ?? 0} exit${doc.exits?.length === 1 ? "" : "s"} today`,
    },
    {
      icon: Target,
      label: "Free slots after exits",
      value: String(doc.free_slots_after_exits ?? "—"),
      positive: true,
      foot: `${doc.buy_candidates_ranked?.length ?? 0} candidates ranked`,
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
