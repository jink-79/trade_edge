import { Resend } from "resend";
import { env } from "../../config/env";

export interface PositionUpdate {
  symbol: string;
  quantity: number;
  entryPrice: number;
  todayClose: number | null;
  sinceEntryPct: number | null;
  todayChangePct: number | null;
  summary: string;
  /** phalanx-live's daily_signals flagged this symbol's trend as flipped
   * down today — the strategy's only real exit signal. */
  sellSignal: boolean;
  /** phalanx-live's daily_signals flagged this symbol's price data as stale
   * today — a data gap on a real position, not just a missed candidate. */
  dataStale: boolean;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtRs(n: number | null): string {
  return n == null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function buildAlertBanner(sellAlerts: PositionUpdate[]): string {
  if (sellAlerts.length === 0) return "";
  const rows = sellAlerts
    .map(
      (p) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid #4c1d1d;">
          <span style="font-size:14px;font-weight:600;color:#fecaca;">${p.symbol}</span>
          <span style="font-size:12px;color:#fca5a5;">trend flipped down — ${p.quantity} qty @ ${fmtRs(p.entryPrice)}</span>
        </div>`,
    )
    .join("");

  return `
    <div style="border:1px solid #7f1d1d;border-radius:12px;padding:16px 18px;margin-bottom:20px;background:#1f0d0d;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;">🔴</span>
        <span style="font-size:15px;font-weight:700;color:#fecaca;">
          SELL signal today — ${sellAlerts.length} position${sellAlerts.length > 1 ? "s" : ""}
        </span>
      </div>
      <p style="margin:6px 0 0;font-size:12px;color:#fca5a5;">
        phalanx-live's daily scan flagged the trend as flipped down. Close these out — nothing
        does this automatically.
      </p>
      ${rows}
    </div>`;
}

function buildHtml(positions: PositionUpdate[], dateLabel: string): string {
  const sellAlerts = positions.filter((p) => p.sellSignal);

  const cards = positions
    .map((p) => {
      const upSinceEntry = (p.sinceEntryPct ?? 0) >= 0;
      const upToday = (p.todayChangePct ?? 0) >= 0;
      const alertBorder = p.sellSignal ? "border:1px solid #7f1d1d;" : "border:1px solid #2a2f3a;";
      return `
        <div style="${alertBorder}border-radius:12px;padding:16px 18px;margin-bottom:14px;background:#12141a;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:16px;font-weight:600;color:#f5f5f5;">
              ${p.symbol}${p.sellSignal ? ' <span style="color:#f87171;font-size:12px;">● SELL</span>' : ""}
            </span>
            <span style="font-size:13px;color:#9aa0aa;">${p.quantity} qty @ ${fmtRs(p.entryPrice)}</span>
          </div>
          <div style="margin-top:8px;display:flex;gap:18px;font-size:13px;">
            <span style="color:#9aa0aa;">Close ${fmtRs(p.todayClose)}</span>
            <span style="color:${upToday ? "#22c55e" : "#ef4444"};">Today ${fmtPct(p.todayChangePct)}</span>
            <span style="color:${upSinceEntry ? "#22c55e" : "#ef4444"};">Since entry ${fmtPct(p.sinceEntryPct)}</span>
          </div>
          ${
            p.dataStale
              ? `<p style="margin-top:8px;font-size:12px;color:#fbbf24;">⚠ Price data was stale for this symbol in today's scan — treat today's close with caution.</p>`
              : ""
          }
          <p style="margin-top:10px;font-size:13px;line-height:1.5;color:#c8ccd4;">${p.summary}</p>
        </div>`;
    })
    .join("");

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0c10;padding:24px;">
      <h2 style="color:#f5f5f5;font-size:18px;">Open positions — ${dateLabel}</h2>
      ${buildAlertBanner(sellAlerts)}
      ${cards}
      <p style="color:#6b7280;font-size:11px;margin-top:16px;">
        TradeEdge daily newsletter — Trend + RS-55 open positions, auto-generated.
      </p>
    </div>`;
}

export async function sendPositionsNewsletter(
  to: string,
  positions: PositionUpdate[],
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const sellCount = positions.filter((p) => p.sellSignal).length;
  const subject =
    sellCount > 0
      ? `🔴 ${sellCount} SELL signal${sellCount > 1 ? "s" : ""} — ${dateLabel}`
      : `Open positions update — ${dateLabel}`;

  const { error } = await resend.emails.send({
    from: env.NEWSLETTER_FROM_EMAIL,
    to,
    subject,
    html: buildHtml(positions, dateLabel),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
