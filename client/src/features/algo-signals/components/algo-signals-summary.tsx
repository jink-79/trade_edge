import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDateTime, fmtMoney } from "./algo-signals-format";
import type { DailySignalDoc, WeeklySignalDoc } from "../types/algo-signals.types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function AlgoSignalsSummary({ doc }: { doc: DailySignalDoc | WeeklySignalDoc }) {
  const referenceLabel = "reference_date" in doc ? "Reference date" : "Reference week";
  const referenceValue = "reference_date" in doc ? doc.reference_date : doc.reference_week;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={referenceLabel} value={referenceValue?.slice(0, 10) ?? "—"} />
          <Stat label="Capital" value={fmtMoney(doc.capital)} />
          <Stat label="Max positions" value={String(doc.max_positions ?? "—")} />
          <Stat label="Free slots after exits" value={String(doc.free_slots_after_exits ?? "—")} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Generated {fmtDateTime(doc.generated_at)} · {doc.held_before?.length ?? 0} held before this run
        </p>
      </CardContent>
    </Card>
  );
}
