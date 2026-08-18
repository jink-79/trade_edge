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
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtRs(n: number | null): string {
  return n == null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function buildHtml(positions: PositionUpdate[], dateLabel: string): string {
  const cards = positions
    .map((p) => {
      const upSinceEntry = (p.sinceEntryPct ?? 0) >= 0;
      const upToday = (p.todayChangePct ?? 0) >= 0;
      return `
        <div style="border:1px solid #2a2f3a;border-radius:12px;padding:16px 18px;margin-bottom:14px;background:#12141a;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:16px;font-weight:600;color:#f5f5f5;">${p.symbol}</span>
            <span style="font-size:13px;color:#9aa0aa;">${p.quantity} qty @ ${fmtRs(p.entryPrice)}</span>
          </div>
          <div style="margin-top:8px;display:flex;gap:18px;font-size:13px;">
            <span style="color:#9aa0aa;">Close ${fmtRs(p.todayClose)}</span>
            <span style="color:${upToday ? "#22c55e" : "#ef4444"};">Today ${fmtPct(p.todayChangePct)}</span>
            <span style="color:${upSinceEntry ? "#22c55e" : "#ef4444"};">Since entry ${fmtPct(p.sinceEntryPct)}</span>
          </div>
          <p style="margin-top:10px;font-size:13px;line-height:1.5;color:#c8ccd4;">${p.summary}</p>
        </div>`;
    })
    .join("");

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0c10;padding:24px;">
      <h2 style="color:#f5f5f5;font-size:18px;">Open positions — ${dateLabel}</h2>
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

  const { error } = await resend.emails.send({
    from: env.NEWSLETTER_FROM_EMAIL,
    to,
    subject: `Open positions update — ${dateLabel}`,
    html: buildHtml(positions, dateLabel),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
