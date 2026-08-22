import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera } from "lucide-react";
import { fmtINR } from "@/lib/positions-utils";
import type { DashboardTradeSnapshot } from "../types/dashboard.types";

const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${fmtINR(n)}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function Stat({
  label,
  value,
  sub,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad";
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-lg border border-border/60 bg-background/40 p-3 text-left ${
        onClick ? "cursor-pointer hover:bg-accent/30 transition-colors" : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-base font-semibold tabular tracking-tight ${
          tone === "good" ? "text-primary" : tone === "bad" ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5 tabular">{sub}</div>}
    </Comp>
  );
}

export function TradeSnapshotCard({ snapshot }: { snapshot: DashboardTradeSnapshot }) {
  const navigate = useNavigate();
  const { highestProfitTrade: best, highestLossTrade: worst } = snapshot;

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Camera className="size-4 text-primary" /> Trade Snapshot
        </CardTitle>
        <CardDescription>Best/worst trades, hold time and win/loss averages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat
            label="Highest profit trade"
            value={best ? fmtSigned(best.pnl) : "—"}
            sub={best ? `${best.symbol} · ${fmtDate(best.date)}` : undefined}
            tone="good"
            onClick={best ? () => navigate(`/trades/${best.id}`) : undefined}
          />
          <Stat
            label="Highest loss trade"
            value={worst ? fmtSigned(worst.pnl) : "—"}
            sub={worst ? `${worst.symbol} · ${fmtDate(worst.date)}` : undefined}
            tone="bad"
            onClick={worst ? () => navigate(`/trades/${worst.id}`) : undefined}
          />
          <Stat label="Avg. trade time" value={snapshot.avgTradeTime} />
          <Stat label="Avg. time in profit trade" value={snapshot.avgTimeInProfitTrade} tone="good" />
          <Stat label="Avg. time in loss trade" value={snapshot.avgTimeInLossTrade} tone="bad" />
          <Stat label="Avg. win trade" value={fmtSigned(snapshot.avgWinTrade)} tone="good" />
          <Stat label="Avg. win day P&L" value={fmtSigned(snapshot.avgWinDayPnl)} tone="good" />
          <Stat label="Avg. loss trade" value={fmtSigned(snapshot.avgLossTrade)} tone="bad" />
          <Stat label="Avg. loss day P&L" value={fmtSigned(snapshot.avgLossDayPnl)} tone="bad" />
        </div>
      </CardContent>
    </Card>
  );
}
