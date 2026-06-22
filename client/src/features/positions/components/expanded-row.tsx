import { Activity } from "lucide-react";
import type { EnrichedPosition } from "../types/positions.types";
import { fmtDate, fmtINR } from "@/lib/positions-utils";

interface ExpandedRowProps {
  pos: EnrichedPosition;
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

export function ExpandedRow({ pos }: ExpandedRowProps) {
  const stopPrice = pos.trailingActive
    ? pos.trailingStopPrice!
    : pos.structureExitLow;
  const stopLabel = pos.trailingActive ? "Trailing Stop" : "Structure Exit";
  const riskAmt = (pos.currentPrice - stopPrice) * pos.qty;

  return (
    <tr>
      <td
        colSpan={8}
        className="bg-[oklch(0.18_0.012_252)] border-b border-border/60"
      >
        {/* ── 4-column detail grid ── */}
        <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-5">
          <DetailSection title="Stop Details">
            <DetailRow label={stopLabel} value={fmtINR(stopPrice)} />
            <DetailRow
              label="Risk (₹)"
              value={`${riskAmt < 0 ? "-" : "+"}${fmtINR(Math.abs(riskAmt))}`}
              valueClass={riskAmt < 0 ? "text-destructive" : "text-primary"}
            />
            <DetailRow
              label="Risk (%)"
              value={`${pos.riskToStop.toFixed(2)}%`}
              valueClass={
                pos.riskToStop < 0 ? "text-destructive" : "text-primary"
              }
            />
          </DetailSection>

          <DetailSection title="Price Levels">
            <DetailRow label="Entry" value={fmtINR(pos.entryPrice)} />
            <DetailRow label="Current" value={fmtINR(pos.currentPrice)} />
            <DetailRow
              label="Highest Close"
              value={fmtINR(pos.highestCloseSinceEntry)}
            />
          </DetailSection>

          <DetailSection title="Trail Status">
            <DetailRow
              label="Trail Active"
              value={
                pos.trailingActive ? (
                  <span className="text-primary">Yes</span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )
              }
            />
            {pos.trailingActive ? (
              <>
                <DetailRow
                  label="Trail Price"
                  value={fmtINR(pos.trailingStopPrice!)}
                />
                <DetailRow
                  label="Activated"
                  value={fmtDate(pos.trailActivatedDate)}
                />
              </>
            ) : (
              <DetailRow label="Trailing Stop" value="—" />
            )}
          </DetailSection>

          <DetailSection title="Position Meta">
            <DetailRow label="Entry Date" value={fmtDate(pos.entryDate)} />
            <DetailRow label="Holding Days" value={`${pos.holdingDays}d`} />
            <DetailRow
              label="Exit Signal"
              value={
                pos.exitSignal ? (
                  <span className="text-destructive">⚠ Active</span>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )
              }
            />
          </DetailSection>
        </div>

        {/* ── Drawdown bar ── */}
        <div className="px-6 pb-5">
          <div className="p-3 rounded-lg bg-[oklch(0.205_0.014_252)] border border-border/40">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Activity className="size-3" /> Drawdown from peak
              </span>
              <span
                className={`tabular font-medium ${pos.upsideFromHigh < 0 ? "text-destructive" : "text-primary"}`}
              >
                {pos.upsideFromHigh.toFixed(2)}%
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full ${pos.upsideFromHigh < 0 ? "bg-destructive" : "bg-primary"}`}
                style={{
                  width: `${Math.min(100, Math.abs(pos.upsideFromHigh) * 10)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground tabular">
              <span>Peak: {fmtINR(pos.highestCloseSinceEntry)}</span>
              <span>Now: {fmtINR(pos.currentPrice)}</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
