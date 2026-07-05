/**
 * DATA CONTRACT
 * Feature: Mutual Funds Portfolio Tracking
 * Description: Interface definitions for recording and displaying Mutual Fund investment transactions, category segmentations, and automated metrics metrics.
 */

export type FundCategory = "Smallcap" | "Midcap" | "Largecap" | "Flexicap";

export interface MutualFundEntry {
  _id: string;
  date: string; // ISO String
  fundName: string;
  category: FundCategory;
  nav: number;
  units: number;
  amount: number;
}

export interface NewFundEntryPayload {
  fundName: string;
  date: string; // ISO String
  amount: number;
  nav: number;
  units: number;
  category: FundCategory;
}

export interface CategoryBreakdown {
  Smallcap: number;
  Midcap: number;
  Largecap: number;
  Flexicap: number;
}

export interface MutualFundsSummary {
  totalInvested: number;
  totalUnits: number;
  totalEntries: number;
  byCategory: CategoryBreakdown;
}

export interface SortState {
  col: string;
  dir: "asc" | "desc";
}

export interface DonutDataPoint {
  name: FundCategory;
  value: number;
  color: string;
}
