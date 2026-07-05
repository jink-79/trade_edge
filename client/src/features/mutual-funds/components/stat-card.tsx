import { type LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  accent?: boolean;
  iconColor?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  positive,
  accent,
  iconColor,
}: StatCardProps) {
  return (
    <Card
      className={`relative overflow-hidden border-border/70 bg-card/70 backdrop-blur-sm ${accent ? "ring-1 ring-primary/30" : ""}`}
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
          <div
            className="size-7 rounded-md grid place-items-center ring-1 ring-border/70"
            style={{ background: "oklch(0.3 0.04 250)" }}
          >
            <Icon
              className={`size-3.5 ${iconColor ?? "text-muted-foreground"}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-1.5">
        <div className="text-2xl font-semibold tabular tracking-tight">
          {value}
        </div>
        {sub && (
          <p
            className={`text-xs ${
              positive === true
                ? "text-primary"
                : positive === false
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
