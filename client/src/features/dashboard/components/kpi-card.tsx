import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDownRight, ArrowUpRight, type Wallet } from "lucide-react";

export function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  positive,
  foot,
  accent,
  progress,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  foot: string;
  accent?: boolean;
  progress?: number;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-border/70 bg-card/70 backdrop-blur-sm ${
        accent ? "ring-1 ring-primary/30" : ""
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {accent && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, oklch(0.78 0.17 155 / 18%), transparent 60%)",
          }}
        />
      )}
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] uppercase tracking-[0.16em]">
            {label}
          </CardDescription>
          <div className="size-7 rounded-md bg-accent/60 grid place-items-center ring-1 ring-border/70">
            <Icon className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-2">
        <div className="text-2xl font-semibold tabular tracking-tight">
          {value}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span
            className={`inline-flex items-center gap-0.5 tabular rounded-md px-1.5 py-0.5 ${
              positive
                ? "text-primary bg-primary/10"
                : "text-destructive bg-destructive/10"
            }`}
          >
            {positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta}
          </span>
          <span className="text-muted-foreground">{foot}</span>
        </div>
        {typeof progress === "number" && (
          <Progress value={progress} className="h-1 bg-secondary/80" />
        )}
      </CardContent>
    </Card>
  );
}
