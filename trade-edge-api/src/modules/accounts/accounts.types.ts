import { z } from "zod";

// ── Constants ────────────────────────────────────────────────────────────────

export const ACCOUNT_TYPES = ["mf", "stock", "bank", "loan", "card"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Loans and cards are money owed: their values count against net worth. */
export const LIABILITY_TYPES: readonly AccountType[] = ["loan", "card"];

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

// ── Schemas ──────────────────────────────────────────────────────────────────

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-11");

const money = z.number().min(0, "Amount cannot be negative").max(1e12);

export const AccountIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid account id"),
});

export const SnapshotParamsSchema = AccountIdParamsSchema.extend({ month });

export const CreateAccountSchema = z.object({
  type: z.enum(ACCOUNT_TYPES),
  name: z.string().trim().min(1, "Name is required").max(80),
  institution: z.string().trim().max(60).optional(),
  mfCategory: z.enum(MF_CATEGORIES).optional(),
  // Opening value, so a new account isn't empty until next month's update.
  month,
  value: money,
  invested: money.optional(),
});

export const UpdateAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    institution: z.string().trim().max(60).nullable(),
    mfCategory: z.enum(MF_CATEGORIES).nullable(),
    closed: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const UpsertSnapshotSchema = z.object({
  value: money,
  invested: money.nullable().optional(),
});

export const MonthParamsSchema = z.object({ month });

export const SaveMonthSchema = z.object({
  entries: z
    .array(
      z.object({
        accountId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid account id"),
        value: money,
        invested: money.nullable().optional(),
      }),
    )
    .min(1, "Nothing to save")
    .max(200)
    .refine((e) => new Set(e.map((x) => x.accountId)).size === e.length, "An account appears twice"),
});

export type SaveMonthInput = z.infer<typeof SaveMonthSchema>;
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type UpsertSnapshotInput = z.infer<typeof UpsertSnapshotSchema>;

// ── Response shapes ──────────────────────────────────────────────────────────

export interface SnapshotDto {
  month: string;
  value: number;
  invested: number | null;
}

export interface AccountDto {
  id: string;
  type: AccountType;
  name: string;
  institution: string | null;
  mfCategory: string | null;
  closed: boolean;
  createdAt: Date;
  /** Most recent month with a value, or null if none yet. */
  latest: SnapshotDto | null;
}

export interface AccountDetailDto extends AccountDto {
  /** Newest first. */
  snapshots: SnapshotDto[];
}

export interface SnapshotRowDto extends SnapshotDto {
  accountId: string;
}
