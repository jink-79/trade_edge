// Mirrors trade-edge-api/src/modules/accounts/accounts.types.ts

export type AccountType = "mf" | "stock" | "bank" | "loan" | "card";

export const MF_CATEGORIES = [
  "Largecap",
  "Midcap",
  "Smallcap",
  "Flexicap",
  "Multicap",
  "Index",
  "ELSS",
  "Hybrid",
  "Debt",
  "Other",
] as const;
export type MfCategory = (typeof MF_CATEGORIES)[number];

export interface Snapshot {
  month: string; // "YYYY-MM"
  value: number;
  invested: number | null;
}

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  institution: string | null;
  mfCategory: MfCategory | null;
  closed: boolean;
  createdAt: string;
  latest: Snapshot | null;
}

export interface AccountDetail extends Account {
  snapshots: Snapshot[]; // newest first
}

export interface CreateAccountPayload {
  type: AccountType;
  name: string;
  institution?: string;
  mfCategory?: MfCategory;
  month: string;
  value: number;
  invested?: number;
}

export interface UpdateAccountPayload {
  name?: string;
  institution?: string | null;
  mfCategory?: MfCategory | null;
  closed?: boolean;
}

export interface UpsertSnapshotPayload {
  value: number;
  invested?: number | null;
}
