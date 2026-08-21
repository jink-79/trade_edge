import { Resend } from "resend";
import { env } from "../../config/env";

export interface PositionUpdate {
  symbol: string;
  quantity: number;
  entryPrice: number;
  todayClose: number | null;
  sinceEntryPct: number | null;
  todayChangePct: number | null;
  /** Gemini's general-knowledge take on the stock — no live data, not news.
   * Null when the call failed; the card just omits the section rather than
   * showing an error. */
  aiTake: string | null;
  /** phalanx-live's daily_signals flagged this symbol's trend as flipped
   * down today — the strategy's only real exit signal. */
  sellSignal: boolean;
  /** phalanx-live's daily_signals flagged this symbol's price data as stale
   * today — a data gap on a real position, not just a missed candidate. */
  dataStale: boolean;
}

const C = {
  bg: "#0a0b0e",
  card: "#131519",
  cardBorder: "#22252b",
  text: "#f0f1f3",
  textMuted: "#8a8f98",
  textFaint: "#5c6169",
  green: "#34d399",
  red: "#f87171",
  amber: "#fbbf24",
  redBg: "#1a0f10",
  redBorder: "#4c1d1d",
};

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtRs(n: number | null): string {
  return n == null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function toneColor(n: number | null): string {
  if (n == null) return C.textMuted;
  return n >= 0 ? C.green : C.red;
}

function buildAlertBanner(sellAlerts: PositionUpdate[]): string {
  if (sellAlerts.length === 0) return "";
  const rows = sellAlerts
    .map(
      (p) => `
        <tr>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:${C.text};">${p.symbol}</td>
          <td style="padding:6px 0;font-size:12px;color:${C.textMuted};text-align:right;">${p.quantity} qty @ ${fmtRs(p.entryPrice)}</td>
        </tr>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${C.redBg};border:1px solid ${C.redBorder};border-radius:10px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:13px;font-weight:700;color:${C.red};letter-spacing:0.02em;">
          🔴 SELL SIGNAL — ${sellAlerts.length} position${sellAlerts.length > 1 ? "s" : ""}
        </div>
        <div style="font-size:12px;color:#e19b9b;margin-top:4px;">
          phalanx-live's scan flagged the trend as flipped down. Nothing closes this out automatically.
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid ${C.redBorder};">
          ${rows}
        </table>
      </td></tr>
    </table>`;
}

function buildPositionCard(p: PositionUpdate): string {
  const sinceColor = toneColor(p.sinceEntryPct);
  const todayColor = toneColor(p.todayChangePct);
  const border = p.sellSignal ? C.redBorder : C.cardBorder;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:${C.card};border:1px solid ${border};border-radius:10px;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:15px;font-weight:700;color:${C.text};">
              ${p.symbol}${p.sellSignal ? `&nbsp;<span style="font-size:10px;font-weight:700;color:${C.red};border:1px solid ${C.redBorder};border-radius:4px;padding:2px 6px;vertical-align:middle;">SELL</span>` : ""}
            </td>
            <td style="font-size:12px;color:${C.textMuted};text-align:right;">${p.quantity} qty @ ${fmtRs(p.entryPrice)}</td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
          <tr>
            <td style="font-size:11px;color:${C.textFaint};text-transform:uppercase;letter-spacing:0.06em;">Close</td>
            <td style="font-size:11px;color:${C.textFaint};text-transform:uppercase;letter-spacing:0.06em;text-align:center;">Today</td>
            <td style="font-size:11px;color:${C.textFaint};text-transform:uppercase;letter-spacing:0.06em;text-align:right;">Since entry</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:${C.text};font-weight:600;padding-top:2px;">${fmtRs(p.todayClose)}</td>
            <td style="font-size:14px;color:${todayColor};font-weight:600;text-align:center;padding-top:2px;">${fmtPct(p.todayChangePct)}</td>
            <td style="font-size:14px;color:${sinceColor};font-weight:600;text-align:right;padding-top:2px;">${fmtPct(p.sinceEntryPct)}</td>
          </tr>
        </table>

        ${
          p.dataStale
            ? `<div style="margin-top:10px;font-size:11px;color:${C.amber};">⚠ Price data was stale for this symbol in today's scan — treat the close above with caution.</div>`
            : ""
        }

        ${
          p.aiTake
            ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#0e1013;border:1px solid ${C.cardBorder};border-radius:8px;">
                <tr><td style="padding:10px 12px;">
                  <div style="font-size:10px;color:${C.textFaint};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">
                    AI perspective · not live news
                  </div>
                  <div style="font-size:12px;line-height:1.5;color:${C.textMuted};">${p.aiTake}</div>
                </td></tr>
              </table>`
            : ""
        }
      </td></tr>
    </table>`;
}

function buildHtml(positions: PositionUpdate[], dateLabel: string): string {
  const sellAlerts = positions.filter((p) => p.sellSignal);
  const totalPnlPct =
    positions.length > 0
      ? positions.reduce((s, p) => s + (p.sinceEntryPct ?? 0), 0) / positions.length
      : null;

  return `
  <div style="background:${C.bg};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
      <tr><td>
        <div style="font-size:11px;color:${C.textFaint};text-transform:uppercase;letter-spacing:0.1em;">TradeEdge · Trend + RS-55</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
          <tr>
            <td style="font-size:20px;font-weight:700;color:${C.text};">Open positions</td>
            <td style="font-size:12px;color:${C.textMuted};text-align:right;vertical-align:bottom;padding-bottom:3px;">${dateLabel}</td>
          </tr>
        </table>
        <div style="font-size:13px;color:${C.textMuted};margin-top:6px;">
          ${positions.length} position${positions.length === 1 ? "" : "s"} · avg since-entry
          <span style="color:${toneColor(totalPnlPct)};font-weight:600;">${fmtPct(totalPnlPct)}</span>
        </div>

        <div style="height:1px;background:${C.cardBorder};margin:20px 0;"></div>

        ${buildAlertBanner(sellAlerts)}
        ${positions.map(buildPositionCard).join("")}

        <div style="font-size:11px;color:${C.textFaint};margin-top:8px;line-height:1.6;">
          Auto-generated daily. Price data from phalanx-live's OHLCV scan; AI notes are general
          knowledge, not real-time research — verify before acting.
        </div>
      </td></tr>
    </table>
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
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const sellCount = positions.filter((p) => p.sellSignal).length;
  const subject =
    sellCount > 0
      ? `🔴 ${sellCount} SELL signal${sellCount > 1 ? "s" : ""} — ${dateLabel}`
      : `Open positions — ${dateLabel}`;

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
