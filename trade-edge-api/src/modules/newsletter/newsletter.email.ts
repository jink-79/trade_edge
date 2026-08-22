import { Resend } from "resend";
import { env } from "../../config/env";

export interface PositionUpdate {
  symbol: string;
  quantity: number;
  entryPrice: number;
  entryDate: Date;
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

export interface NewsletterSummary {
  positionCount: number;
  capitalDeployed: number;
  currentValue: number;
  pnlAmount: number;
  pnlPct: number | null;
  maxPositions: number | null;
  freeSlots: number | null;
}

const C = {
  bg: "#0d1321",
  card: "#141b2e",
  cardBorder: "#232c45",
  alertCard: "#1c1216",
  alertBorder: "#5c2b2b",
  text: "#e7ebf5",
  textMuted: "#8a92ab",
  textFaint: "#4f597a",
  green: "#5cba7d",
  red: "#e0685f",
  amber: "#e8bd6a",
  accent: "#6f86c9",
  chipSellBg: "#3a1a1a",
  chipSellText: "#f2938c",
  chipSellBorder: "#5c2b2b",
  chipStaleBg: "#3a2f14",
  chipStaleText: "#e8bd6a",
  chipStaleBorder: "#5c4a1f",
  noteBg: "#0f1526",
};

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtRs(n: number | null): string {
  return n == null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function toneColor(n: number | null): string {
  if (n == null) return C.textMuted;
  return n >= 0 ? C.green : C.red;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function buildStatGrid(summary: NewsletterSummary): string {
  const cells = [
    { k: "Positions", v: String(summary.positionCount), color: C.text },
    { k: "Deployed", v: fmtRs(summary.capitalDeployed), color: C.text },
    { k: "P&amp;L", v: fmtRs(summary.pnlAmount), color: toneColor(summary.pnlAmount) },
    { k: "Return", v: fmtPct(summary.pnlPct), color: toneColor(summary.pnlPct) },
  ];
  if (summary.maxPositions != null && summary.freeSlots != null) {
    cells.push({
      k: "Slots free",
      v: `${summary.freeSlots} / ${summary.maxPositions}`,
      color: C.text,
    });
  }

  const cols = cells
    .map(
      (c) => `
        <td width="${Math.floor(100 / cells.length)}%" style="padding:0 4px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.card};border:1px solid ${C.cardBorder};border-radius:8px;">
            <tr><td style="padding:12px 14px;">
              <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textMuted};margin-bottom:6px;">${c.k}</div>
              <div style="font-size:18px;font-weight:700;color:${c.color};">${c.v}</div>
            </td></tr>
          </table>
        </td>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 24px;">
      <tr>${cols}</tr>
    </table>`;
}

function buildChip(label: string, bg: string, text: string, border: string): string {
  return `<span style="font-size:9px;font-weight:800;letter-spacing:0.04em;padding:3px 7px;border-radius:5px;background:${bg};color:${text};border:1px solid ${border};margin-left:6px;">${label}</span>`;
}

function buildPositionCard(p: PositionUpdate): string {
  const sinceColor = toneColor(p.sinceEntryPct);
  const cardBg = p.sellSignal ? C.alertCard : C.card;
  const cardBorder = p.sellSignal ? C.alertBorder : C.cardBorder;
  const capitalUsed = p.entryPrice * p.quantity;
  const currentValue = p.todayClose != null ? p.todayClose * p.quantity : null;
  const pnlAmount = currentValue != null ? currentValue - capitalUsed : null;

  const chips = [
    p.sellSignal ? buildChip("SELL", C.chipSellBg, C.chipSellText, C.chipSellBorder) : "",
    p.dataStale ? buildChip("STALE", C.chipStaleBg, C.chipStaleText, C.chipStaleBorder) : "",
  ].join("");

  const bars = [
    { k: "Capital", v: fmtRs(capitalUsed), color: C.text },
    { k: "Value", v: fmtRs(currentValue), color: C.text },
    { k: "P&amp;L", v: fmtRs(pnlAmount), color: toneColor(pnlAmount) },
    { k: "Return", v: fmtPct(p.sinceEntryPct), color: sinceColor },
  ]
    .map(
      (b) => `
        <td width="25%">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textMuted};margin-bottom:4px;">${b.k}</div>
          <div style="font-size:13px;font-weight:700;color:${b.color};">${b.v}</div>
        </td>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:${cardBg};border:1px solid ${cardBorder};border-radius:10px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:15px;font-weight:800;color:${C.text};">${p.symbol}${chips}</td>
            <td style="font-size:11px;color:${C.textMuted};text-align:right;">${p.quantity} qty · ${fmtDate(p.entryDate)}</td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;padding:10px 0;border-top:1px solid #1f2740;border-bottom:1px solid #1f2740;">
          <tr>${bars}</tr>
        </table>

        ${
          p.dataStale
            ? `<div style="font-size:11px;color:${C.amber};margin-bottom:8px;">⚠ Price data was stale for this symbol in today's scan — treat the numbers above with caution.</div>`
            : ""
        }

        ${
          p.aiTake
            ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.noteBg};border:1px solid ${C.cardBorder};border-radius:8px;">
                <tr><td style="padding:10px 12px;">
                  <div style="font-size:12px;line-height:1.6;color:${C.textMuted};margin-bottom:4px;">${p.aiTake}</div>
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textFaint};">AI perspective · not live news</div>
                </td></tr>
              </table>`
            : ""
        }
      </td></tr>
    </table>`;
}

function buildHtml(
  positions: PositionUpdate[],
  summary: NewsletterSummary,
  dateLabel: string,
): string {
  const sellAlerts = positions.filter((p) => p.sellSignal);
  const sorted = [...positions].sort((a, b) => Number(b.sellSignal) - Number(a.sellSignal));

  return `
  <div style="background:${C.bg};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr><td>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.accent};">TradeEdge · Trend + RS-55</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
          <tr>
            <td style="font-size:21px;font-weight:800;color:${C.text};letter-spacing:-0.01em;">Open positions</td>
            <td style="font-size:12px;color:${C.textMuted};text-align:right;vertical-align:bottom;padding-bottom:3px;">${dateLabel}</td>
          </tr>
        </table>

        ${buildStatGrid(summary)}

        ${
          sellAlerts.length > 0
            ? `<div style="font-size:12px;font-weight:700;color:${C.red};margin-bottom:10px;">
                🔴 ${sellAlerts.length} SELL signal${sellAlerts.length > 1 ? "s" : ""} — phalanx-live flagged the trend as flipped down. Nothing closes this out automatically.
              </div>`
            : ""
        }

        ${sorted.map(buildPositionCard).join("")}

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
  summary: NewsletterSummary,
  priceAsOfDate: Date | null,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  const resend = new Resend(env.RESEND_API_KEY);
  // The actual OHLCV trading-day date behind these prices (phalanx-live's
  // tvdatafeed cron), not "today" — the send can run hours after that data
  // was written, and would otherwise mislabel yesterday's close as today's.
  const dateLabel = (priceAsOfDate ?? new Date()).toLocaleDateString("en-IN", {
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
    html: buildHtml(positions, summary, dateLabel),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
