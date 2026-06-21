import type { Fund, FundsResponse } from "../types/funds.types";

export const MOCK_FUNDS: Fund[] = [
  {
    _id: "f001",
    name: "Zerodha",
    type: "trading",
    date: "2026-06-15T00:00:00.000Z",
    amount: 50000,
    notes: "Monthly top-up",
    createdAt: "2026-06-15T10:00:00Z",
  },
  {
    _id: "f002",
    name: "Groww",
    type: "trading",
    date: "2026-06-10T00:00:00.000Z",
    amount: 25000,
    notes: "Options margin",
    createdAt: "2026-06-10T09:30:00Z",
  },
  {
    _id: "f003",
    name: "HDFC Savings",
    type: "savings",
    date: "2026-06-05T00:00:00.000Z",
    amount: 100000,
    notes: "Emergency buffer",
    createdAt: "2026-06-05T11:00:00Z",
  },
  {
    _id: "f004",
    name: "Zerodha",
    type: "trading",
    date: "2026-05-28T00:00:00.000Z",
    amount: 30000,
    notes: "",
    createdAt: "2026-05-28T09:15:00Z",
  },
  {
    _id: "f005",
    name: "SBI Emergency",
    type: "emergency",
    date: "2026-05-20T00:00:00.000Z",
    amount: 75000,
    notes: "6-month runway",
    createdAt: "2026-05-20T08:00:00Z",
  },
  {
    _id: "f006",
    name: "Zerodha",
    type: "trading",
    date: "2026-05-15T00:00:00.000Z",
    amount: 50000,
    notes: "Monthly top-up",
    createdAt: "2026-05-15T10:00:00Z",
  },
  {
    _id: "f007",
    name: "ICICI Savings",
    type: "savings",
    date: "2026-05-01T00:00:00.000Z",
    amount: 40000,
    notes: "",
    createdAt: "2026-05-01T12:00:00Z",
  },
  {
    _id: "f008",
    name: "Groww",
    type: "trading",
    date: "2026-04-22T00:00:00.000Z",
    amount: 20000,
    notes: "Swing trading capital",
    createdAt: "2026-04-22T09:00:00Z",
  },
  {
    _id: "f009",
    name: "Misc",
    type: "other",
    date: "2026-04-10T00:00:00.000Z",
    amount: 15000,
    notes: "Transferred from wallet",
    createdAt: "2026-04-10T14:00:00Z",
  },
  {
    _id: "f010",
    name: "Zerodha",
    type: "trading",
    date: "2026-04-01T00:00:00.000Z",
    amount: 50000,
    notes: "Monthly top-up",
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    _id: "f011",
    name: "HDFC Savings",
    type: "savings",
    date: "2026-03-20T00:00:00.000Z",
    amount: 60000,
    notes: "Quarterly savings",
    createdAt: "2026-03-20T11:00:00Z",
  },
  {
    _id: "f012",
    name: "Zerodha",
    type: "trading",
    date: "2026-03-01T00:00:00.000Z",
    amount: 50000,
    notes: "Monthly top-up",
    createdAt: "2026-03-01T10:00:00Z",
  },
];

const byType = MOCK_FUNDS.reduce(
  (acc, f) => {
    acc[f.type] = (acc[f.type] ?? 0) + f.amount;
    return acc;
  },
  {} as Record<string, number>,
);

export const MOCK_FUNDS_RESPONSE: FundsResponse = {
  success: true,
  summary: {
    totalFunds: MOCK_FUNDS.reduce((s, f) => s + f.amount, 0),
    totalEntries: MOCK_FUNDS.length,
    byType: byType as FundsResponse["summary"]["byType"],
  },
  data: MOCK_FUNDS,
};
