import { z } from "zod";

export const POSSESSION_CATEGORIES = [
  "vehicle",
  "appliance",
  "electronics",
  "furniture",
  "jewellery",
  "other",
] as const;
export type PossessionCategory = (typeof POSSESSION_CATEGORIES)[number];

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-11");

export const PossessionIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});

export const CreatePossessionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.enum(POSSESSION_CATEGORIES),
  purchasePrice: z.number().positive("Price must be more than 0").max(1e10),
  purchaseMonth: month,
  /** How much value it loses each year, in percent (0 = holds its value). */
  yearlyDropPct: z.number().min(0).max(90),
});

export const UpdatePossessionSchema = CreatePossessionSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "Nothing to update",
);

export type CreatePossessionInput = z.infer<typeof CreatePossessionSchema>;
export type UpdatePossessionInput = z.infer<typeof UpdatePossessionSchema>;

export interface PossessionDto {
  id: string;
  name: string;
  category: PossessionCategory;
  purchasePrice: number;
  purchaseMonth: string;
  yearlyDropPct: number;
  createdAt: Date;
}
