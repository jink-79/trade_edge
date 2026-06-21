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
}

export interface FundsResponse {
  success: boolean;
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
