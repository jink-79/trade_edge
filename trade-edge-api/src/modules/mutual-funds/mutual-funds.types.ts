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

// ── Create Schema ─────────────────────────────────────────────────────────────

export const FUND_CATEGORIES = [
  "Smallcap",
  "Midcap",
  "Largecap",
  "Flexicap",
] as const;

export const CreateMutualFundSchema = z.object({
  fundName: z
    .string()
    .min(2, "Fund name must be at least 2 characters")
    .max(120, "Fund name must be at most 120 characters")
    .trim(),
  date: z.coerce.date(),
  category: z.enum(FUND_CATEGORIES),
  nav: z.number().positive("NAV must be greater than 0"),
  units: z.number().positive("Units must be greater than 0"),
  amount: z.number().positive("Amount must be greater than 0"),
});

export type CreateMutualFundInput = z.infer<typeof CreateMutualFundSchema>;

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
