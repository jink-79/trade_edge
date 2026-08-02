import { z } from "zod";
import { ScorecardVerdictSchema } from "../reports/report.types";

/** Multipart text fields alongside the upload — the archive entry's identity. */
export const UploadMetaSchema = z.object({
  strategyName: z.string().min(1).max(120).trim(),
  version: z.string().min(1).max(20).trim(),
  universe: z.string().min(1).max(60).trim(),
});
export type UploadMeta = z.infer<typeof UploadMetaSchema>;

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});

export const SymbolScorecardQuerySchema = PaginationQuerySchema.extend({
  q: z.string().max(40).trim().optional(), // symbol search
  verdict: ScorecardVerdictSchema.optional(),
});
export type SymbolScorecardQuery = z.infer<typeof SymbolScorecardQuerySchema>;

export const TradeLogQuerySchema = PaginationQuerySchema.extend({
  symbol: z.string().max(40).trim().optional(),
});
export type TradeLogQuery = z.infer<typeof TradeLogQuerySchema>;

export const GroupBreakdownQuerySchema = z.object({
  group: z.enum(["sector", "marketCap"]).default("sector"),
});
export type GroupBreakdownQuery = z.infer<typeof GroupBreakdownQuerySchema>;
