import { ListChecks } from "lucide-react";

const fmtAsOfDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function OpenPositionsHero({
  count,
  needsReview,
  pricesAsOf,
}: {
  count: number;
  needsReview: number;
  /** The OHLCV bar date behind the current mark prices — i.e. which trading
   * day's close phalanx-live's tvdatafeed cron last wrote to Atlas. Null
   * when no open position has been priced yet. */
  pricesAsOf: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <ListChecks className="size-3.5 text-primary" />
        Open positions
      </div>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Live book</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        {count} {count === 1 ? "position" : "positions"} on the book
        {needsReview > 0
          ? `, ${needsReview} awaiting review`
          : ", all reviewed"}
        . Prices refresh automatically daily; close a position out yourself when
        the trade resolves.
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        {pricesAsOf
          ? `Prices as of ${fmtAsOfDate(pricesAsOf)} close`
          : "No priced positions yet — phalanx-live hasn't tracked this symbol"}
      </p>
    </div>
  );
}
