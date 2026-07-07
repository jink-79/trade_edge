import { Shield, Target, TrendingUp, ListChecks } from "lucide-react";
import type { EnrichedPosition } from "../types/positions.types";
import { fmtDate, fmtINR } from "@/lib/positions-utils";

interface ExpandedRowProps {
  pos: EnrichedPosition;
}

type Tone = "good" | "bad" | "muted";

function DetailBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="col-span-6 md:col-span-3 space-y-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  tone?: Tone;
}) {
  const toneClass =
    tone === "good"
      ? "text-primary"
      : tone === "bad"
        ? "text-destructive"
        : tone === "muted"
          ? "text-muted-foreground"
          : "";
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? "tabular" : ""} ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

export function ExpandedRow({ pos }: ExpandedRowProps) {
  const entry = pos.entryPrice;
  const qty = pos.quantity;

  // Effective stop — trailing stop when active, else structure exit
  const stop =
    pos.trailingActive && pos.trailingStopPrice != null
      ? pos.trailingStopPrice
      : pos.structureExitLow;

  const risk = stop != null ? (stop - entry) * qty : null;
  const riskPct = stop != null ? ((stop - entry) / entry) * 100 : null;
  const dd = pos.upsideFromHigh; // drawdown from peak (%)

  const money = (n: number | null | undefined) =>
    n != null ? fmtINR(n) : "—";

  return (
    <tr>
      <td colSpan={8} className="p-0">
        <div className="bg-background/40 border-t border-border/60 p-6 grid grid-cols-12 gap-6">
          <DetailBlock
            title="Stop details"
            icon={<Shield className="size-3.5 text-primary" />}
          >
            <DetailRow label="Trailing stop" value={money(stop)} mono />
            <DetailRow
              label="Risk (₹)"
              value={
                risk != null
                  ? `${risk >= 0 ? "+" : "−"}${fmtINR(Math.abs(risk))}`
                  : "—"
              }
              tone={risk != null ? (risk >= 0 ? "good" : "bad") : "muted"}
            />
            <DetailRow
              label="Risk (%)"
              value={
                riskPct != null
                  ? `${riskPct >= 0 ? "+" : ""}${riskPct.toFixed(2)}%`
                  : "—"
              }
              tone={riskPct != null ? (riskPct >= 0 ? "good" : "bad") : "muted"}
            />
          </DetailBlock>

          <DetailBlock
            title="Price levels"
            icon={<Target className="size-3.5 text-primary" />}
          >
            <DetailRow label="Entry" value={fmtINR(entry)} mono />
            <DetailRow label="Current" value={money(pos.currentPrice)} mono />
            <DetailRow
              label="Highest close"
              value={money(pos.highestCloseSinceEntry)}
              mono
            />
          </DetailBlock>

          <DetailBlock
            title="Trail status"
            icon={<TrendingUp className="size-3.5 text-primary" />}
          >
            <DetailRow
              label="Trail active"
              value={pos.trailingActive ? "Yes" : "No"}
              tone={pos.trailingActive ? "good" : "muted"}
            />
            <DetailRow
              label="Trail price"
              value={money(pos.trailingStopPrice)}
              mono
            />
            <DetailRow
              label="Activated"
              value={pos.trailActivatedDate ? fmtDate(pos.trailActivatedDate) : "—"}
            />
          </DetailBlock>

          <DetailBlock
            title="Position meta"
            icon={<ListChecks className="size-3.5 text-primary" />}
          >
            <DetailRow label="Entry date" value={fmtDate(pos.tradeDate)} />
            <DetailRow label="Holding days" value={`${pos.holdingDays}d`} />
            <DetailRow
              label="Exit signal"
              value={pos.exitSignal ? (pos.exitReason ?? "Active") : "None"}
              tone={pos.exitSignal ? "bad" : "muted"}
            />
            <DetailRow
              label="Drawdown from peak"
              value={
                dd != null ? `${dd >= 0 ? "+" : ""}${dd.toFixed(2)}%` : "—"
              }
              tone={dd != null ? (dd >= 0 ? "good" : "bad") : "muted"}
            />
          </DetailBlock>

          <div className="col-span-12 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-4">
            <span>
              Peak:{" "}
              <span className="text-foreground tabular">
                {money(pos.highestCloseSinceEntry)}
              </span>
              <span className="mx-2 text-border">·</span>
              Now:{" "}
              <span className="text-foreground tabular">
                {money(pos.currentPrice)}
              </span>
            </span>
            <span>
              Sector: <span className="text-foreground">{pos.sector}</span>
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
}
