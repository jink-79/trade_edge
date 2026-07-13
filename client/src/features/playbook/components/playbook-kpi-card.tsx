import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface PlaybookKpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "primary" | "success" | "warning" | "destructive";
}

const toneStyles: Record<PlaybookKpiCardProps["tone"], string> = {
  primary: "from-primary/15 to-transparent text-primary ring-primary/20",
  success: "from-success/15 to-transparent text-success ring-success/20",
  warning: "from-warning/15 to-transparent text-warning ring-warning/20",
  destructive:
    "from-destructive/15 to-transparent text-destructive ring-destructive/20",
};

export function PlaybookKpiCard({
  icon,
  label,
  value,
  sub,
  tone,
}: PlaybookKpiCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="relative p-5">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-br opacity-60",
            toneStyles[tone],
          )}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-foreground">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg bg-background/60 ring-1",
              toneStyles[tone],
            )}
          >
            {icon}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
