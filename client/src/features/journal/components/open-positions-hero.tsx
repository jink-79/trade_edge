import { ListChecks } from "lucide-react";

const fmtRefreshedAt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export function OpenPositionsHero({
  count,
  needsReview,
  lastRefreshedAt,
}: {
  count: number;
  needsReview: number;
  lastRefreshedAt: string | null;
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
        {lastRefreshedAt
          ? `Prices last refreshed ${fmtRefreshedAt(lastRefreshedAt)}`
          : "Prices not yet refreshed for these positions"}
      </p>
    </div>
  );
}
