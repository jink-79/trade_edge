/**
 * DATA CONTRACT
 * Feature: Playbook (Setups & Execution Rules)
 * Description: Manages trading playbook configurations, KPIs, entry/exit rules, and risk envelopes.
 */

export type Bias = "Long" | "Short" | "Both";
export type Timeframe = "Intraday" | "Swing" | "Positional";
export type Status = "Active" | "Paused" | "Draft";

export interface RiskEnvelope {
  perTrade: string;
  stop: string;
  rr: string;
  position: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface Setup {
  id: string;
  name: string;
  tag: string;
  bias: Bias;
  timeframe: Timeframe;
  status: Status;
  category: string;
  pinned: boolean;
  description: string;
  trades: number;
  winRate: number; // Percentage
  avgR: number; // R Multiple
  expectancy: number; // ₹ per trade
  maxDD: number; // Percentage
  lastUsed: string;
  entry: string[];
  exit: string[];
  invalidate: string[];
  risk: RiskEnvelope;
  checklist: ChecklistItem[];
}

export const FILTERS = [
  "All",
  "Active",
  "Paused",
  "Draft",
  "Long",
  "Short",
  "Intraday",
  "Swing",
  "Positional",
] as const;

export type FilterKey = (typeof FILTERS)[number];

export interface PlaybookKpis {
  totalSetups: number;
  activeCount: number;
  avgWinRate: number;
  bestExpectancy: Setup;
}
