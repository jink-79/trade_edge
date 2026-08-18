import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "./algo-signals-format";
import type { DailySignalDoc } from "../types/algo-signals.types";

export function AlgoSignalsHero({ latest }: { latest: DailySignalDoc | null }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          phalanx-live · Trend+RS daily scan
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Algo Signals</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Read-only validation view of phalanx-live's signal engine — a separate system
          (own Atlas cluster, its own GitHub Actions schedule). Signal-only, never
          reconciled with TradeEdge's own trade tracking.
          {latest ? ` Last run ${fmtDateTime(latest.generated_at)}.` : ""}
        </p>
      </div>
      {latest && (
        <div className="flex items-center gap-2">
          <Badge
            className={`border ${
              latest.exits?.length
                ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15"
                : "bg-primary/15 text-primary border-primary/30 hover:bg-primary/15"
            }`}
          >
            {latest.exits?.length ?? 0} exit{latest.exits?.length === 1 ? "" : "s"} today
          </Badge>
          <Badge className="border bg-accent/60 text-foreground border-border/70 hover:bg-accent/60">
            {latest.free_slots_after_exits ?? 0} free slots
          </Badge>
        </div>
      )}
    </div>
  );
}
