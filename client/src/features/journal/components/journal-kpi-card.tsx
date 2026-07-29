import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Reusable KPI tile for the Open Positions / Trade History pages. */
export function JournalKpiCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "bad";
  icon: React.ReactNode;
}) {
  return (
    <Card className="col-span-12 md:col-span-6 xl:col-span-3 border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="size-7 rounded-md grid place-items-center bg-primary/15 ring-1 ring-primary/30">
            {icon}
          </div>
        </div>
        <div
          className={cn(
            "mt-3 font-display text-2xl font-semibold tabular",
            tone === "good" && "text-primary",
            tone === "bad" && "text-destructive",
          )}
        >
          {value}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
