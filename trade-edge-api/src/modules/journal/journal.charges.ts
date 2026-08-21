/**
 * Estimated statutory charges for an NSE equity DELIVERY trade, using
 * Zerodha's published rate card (zero brokerage on delivery; the rest are
 * government/exchange-mandated and apply the same way across brokers).
 * These are estimates — exact stamp duty varies slightly by state and STT/
 * exchange rates are periodically revised — good enough for journal-level
 * net P&L, not a substitute for the broker's own contract note.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

const RATES = {
  sttPct: 0.001, // 0.1% of turnover, charged on BOTH buy and sell legs (delivery)
  exchangeTxnPct: 0.0000297, // NSE transaction charge, ~0.00297% of turnover
  sebiPct: 0.000001, // ₹10 per crore = 0.0001%
  stampDutyPct: 0.00015, // 0.015%, buy leg only
  dpChargesFlat: 15.93, // ₹13.5 + 18% GST, flat per scrip per sell-day (qty-independent)
  gstPct: 0.18, // on brokerage + exchange txn charges + SEBI charges
} as const;

export interface ChargesBreakdown {
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  sebiCharges: number;
  stampDuty: number;
  dpCharges: number;
  gst: number;
  totalCharges: number;
}

/** buyValue/sellValue are the turnover (price × quantity) of the entry leg
 * and the exited leg respectively — for a partial exit, both should already
 * be scaled to the exited quantity, not the full original position. */
export function computeCharges(buyValue: number, sellValue: number): ChargesBreakdown {
  const brokerage = 0;
  const stt = round2((buyValue + sellValue) * RATES.sttPct);
  const exchangeCharges = round2((buyValue + sellValue) * RATES.exchangeTxnPct);
  const sebiCharges = round2((buyValue + sellValue) * RATES.sebiPct);
  const stampDuty = round2(buyValue * RATES.stampDutyPct);
  const dpCharges = RATES.dpChargesFlat;
  const gst = round2((brokerage + exchangeCharges + sebiCharges) * RATES.gstPct);
  const totalCharges = round2(
    brokerage + stt + exchangeCharges + sebiCharges + stampDuty + dpCharges + gst,
  );
  return { brokerage, stt, exchangeCharges, sebiCharges, stampDuty, dpCharges, gst, totalCharges };
}
