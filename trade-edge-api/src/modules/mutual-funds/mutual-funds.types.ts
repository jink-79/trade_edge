import { z } from "zod";

// ── Query Schema ──────────────────────────────────────────────────────────────

export const MutualFundsQuerySchema = z.object({
  category: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 1))
    .pipe(z.number().min(1))
    .default(1),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .pipe(z.number().min(1).max(100))
    .default(20),
});

export type MutualFundsQuery = z.infer<typeof MutualFundsQuerySchema>;

// ── Response Types ────────────────────────────────────────────────────────────

export interface MutualFundEntry {
  id: string;
  date: Date;
  fundName: string;
  category: string;
  nav: number;
  units: number;
  amount: number;
}

export interface MutualFundsResponse {
  entries: MutualFundEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
