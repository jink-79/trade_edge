import { BarChart3 } from "lucide-react";

export function TradeHistoryHero({
  count,
  winners,
}: {
  count: number;
  winners: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <BarChart3 className="size-3.5 text-primary" />
        Trade history · from Kite
      </div>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Closed trades</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        {count} {count === 1 ? "trade" : "trades"} closed, {winners} in profit.
        Realized P&amp;L and R-multiple, computed from your entry and exit.
      </p>
    </div>
  );
}
