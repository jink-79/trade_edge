/* ─────────────────────────────────────────────────────
   DATA CONTRACT
   ─────────────────────────────────────────────────────

   GET /api/funds
   Response: FundsResponse

   POST /api/funds
   Body: AddFundPayload
   Response: { success: boolean; data: Fund }

   DELETE /api/funds/:id
   Response: { success: boolean }
───────────────────────────────────────────────────── */

export type FundType = "trading" | "emergency" | "savings" | "other";

export interface Fund {
  _id: string;
  name: string; // e.g. "Zerodha", "HDFC Savings"
  type: FundType;
  date: string; // ISO — date funds were deposited
  amount: number; // ₹ deposited
  notes?: string;
  createdAt: string;
}

export interface FundsSummary {
  totalFunds: number;
  totalEntries: number;
  byType: Record<FundType, number>;
  /** totalFunds − currently-invested-in-open-positions + all-time realized P&L. */
  availableCash: number;
}

export interface FundsResponse {
  summary: FundsSummary;
  data: Fund[];
}

export interface AddFundPayload {
  name: string;
  type: FundType;
  date: string;
  amount: number;
  notes?: string;
}

export interface SortState {
  col: keyof Fund;
  dir: "asc" | "desc";
}

// ── Statement (Zerodha-style running ledger) ─────────────────────────────

export type StatementEntryType = "deposit" | "buy" | "sell";

export interface StatementEntry {
  id: string;
  date: string;
  type: StatementEntryType;
  description: string;
  symbol: string | null;
  debit: number | null;
  credit: number | null;
  pnl: number | null;
  balance: number;
  refId: string | null;
}

export interface FundsStatementResponse {
  openingBalance: number;
  closingBalance: number;
  totalDeposits: number;
  totalBuys: number;
  totalSells: number;
  totalRealizedPnl: number;
  entries: StatementEntry[];
}
