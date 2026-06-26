import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface HistoryStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  iconColor?: string;
  valueTone?: "pos" | "neg" | "accent";
}

export function HistoryStatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  iconColor,
  valueTone,
}: HistoryStatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 bg-card",
        accent && "ring-1 ring-primary/30",
      )}
    >
      {accent && (
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <div className={cn("rounded-md bg-secondary/60 p-1.5", iconColor)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "font-mono text-2xl font-semibold tracking-tight tabular-nums",
            valueTone === "pos" && "text-success",
            valueTone === "neg" && "text-destructive",
            valueTone === "accent" && "text-primary",
          )}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
