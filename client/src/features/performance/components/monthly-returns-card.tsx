import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MonthlyReturn } from "../types/performance.types";

const label = (m: string) => {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

export function MonthlyReturnsCard({ months }: { months: MonthlyReturn[] }) {
  const valid = months.filter((x) => x.ret != null);
  const max = Math.max(0.0001, ...valid.map((x) => Math.abs(x.ret ?? 0)));

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle
          className="text-base"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Monthly returns
        </CardTitle>
        <CardDescription>Portfolio return by calendar month.</CardDescription>
      </CardHeader>
      <CardContent>
        {valid.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Monthly returns appear once the curve spans a full month.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {valid.map((x) => {
              const r = x.ret ?? 0;
              const pos = r >= 0;
              const intensity = 0.12 + (Math.abs(r) / max) * 0.5;
              return (
                <div
                  key={x.month}
                  className="rounded-lg border px-3 py-2 min-w-[84px]"
                  style={{
                    borderColor: pos
                      ? `color-mix(in oklch, var(--primary) 40%, transparent)`
                      : `color-mix(in oklch, var(--destructive) 40%, transparent)`,
                    background: pos
                      ? `color-mix(in oklch, var(--primary) ${intensity * 100}%, transparent)`
                      : `color-mix(in oklch, var(--destructive) ${intensity * 100}%, transparent)`,
                  }}
                >
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {label(x.month)}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-semibold tabular",
                      pos ? "text-primary" : "text-destructive",
                    )}
                  >
                    {pos ? "+" : ""}
                    {(r * 100).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
