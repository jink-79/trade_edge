import { cn } from "@/lib/utils";
import { type EnrichedTrade } from "../types/history.types";
import { fmtINR, fmtDate, exitStyles } from "../utils/history-utils";

interface HistoryRowDetailsProps {
  trade: EnrichedTrade;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function HistoryRowDetails({ trade }: HistoryRowDetailsProps) {
  const isPnlPositive = trade.pnlAbs >= 0;

  return (
    <tr className="bg-[oklch(0.22_0.015_252)]">
      <td colSpan={9} className="px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Trade Outcome
            </h4>
            <dl className="space-y-2 text-xs">
              <DetailRow
                label="Exit Reason"
                value={
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      exitStyles[trade.exitReason],
                    )}
                  >
                    {trade.exitReason}
                  </span>
                }
              />
              <DetailRow
                label="R-Multiple"
                value={
                  <span
                    className={cn(
                      "font-mono tabular-nums",
                      isPnlPositive ? "text-success" : "text-destructive",
                    )}
                  >
                    {trade.rMultiple >= 0 ? "+" : ""}
                    {trade.rMultiple.toFixed(2)}R
                  </span>
                }
              />
              <DetailRow
                label="Capture"
                value={
                  <span className="font-mono tabular-nums">
                    {Math.max(0, trade.captureRatio).toFixed(0)}% of peak
                  </span>
                }
              />
            </dl>
          </div>
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Price Levels
            </h4>
            <dl className="space-y-2 text-xs">
              <DetailRow
                label="Entry"
                value={
                  <span className="font-mono tabular-nums">
                    {fmtINR(trade.entryPrice)}
                  </span>
                }
              />
              <DetailRow
                label="Exit"
                value={
                  <span className="font-mono font-semibold tabular-nums">
                    {fmtINR(trade.exitPrice)}
                  </span>
                }
              />
              <DetailRow
                label="Highest Close"
                value={
                  <span className="font-mono tabular-nums text-success">
                    {fmtINR(trade.highestCloseSinceEntry)}
                  </span>
                }
              />
            </dl>
          </div>
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Trade Meta
            </h4>
            <dl className="space-y-2 text-xs">
              <DetailRow
                label="Entry Date"
                value={
                  <span className="font-mono">{fmtDate(trade.entryDate)}</span>
                }
              />
              <DetailRow
                label="Exit Date"
                value={
                  <span className="font-mono">{fmtDate(trade.exitDate)}</span>
                }
              />
              <DetailRow
                label="Holding"
                value={
                  <span className="font-mono tabular-nums">
                    {trade.holdingDays}d
                  </span>
                }
              />
            </dl>
          </div>
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Capital
            </h4>
            <dl className="space-y-2 text-xs">
              <DetailRow
                label="Invested"
                value={
                  <span className="font-mono tabular-nums">
                    {fmtINR(trade.invested)}
                  </span>
                }
              />
              <DetailRow
                label="Exit Value"
                value={
                  <span className="font-mono tabular-nums">
                    {fmtINR(trade.exitValue)}
                  </span>
                }
              />
              <DetailRow
                label="Realised P&L"
                value={
                  <span
                    className={cn(
                      "font-mono font-semibold tabular-nums",
                      isPnlPositive ? "text-success" : "text-destructive",
                    )}
                  >
                    {isPnlPositive ? "+" : ""}
                    {fmtINR(trade.pnlAbs)}
                  </span>
                }
              />
            </dl>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/40 p-4 lg:col-span-2">
            <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Trade Notes
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {trade.thesis}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Peak Capture
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums">
                {Math.max(0, trade.captureRatio).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  isPnlPositive ? "bg-success" : "bg-destructive",
                )}
                style={{
                  width: `${Math.min(100, Math.max(0, trade.captureRatio))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
              <span>Entry {fmtINR(trade.entryPrice)}</span>
              <span>Peak {fmtINR(trade.highestCloseSinceEntry)}</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
