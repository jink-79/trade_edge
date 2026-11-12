// Mirrors trade-edge-api/src/modules/possessions/possessions.types.ts

export type PossessionCategory = "vehicle" | "appliance" | "electronics" | "furniture" | "jewellery" | "other";

export interface Possession {
  id: string;
  name: string;
  category: PossessionCategory;
  purchasePrice: number;
  purchaseMonth: string; // "YYYY-MM"
  yearlyDropPct: number;
  createdAt: string;
}

export type PossessionPayload = Omit<Possession, "id" | "createdAt">;
