import { z } from 'zod'

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const FUND_TYPES = ['trading', 'emergency', 'savings', 'other'] as const

export const AddFundSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  type: z.enum(FUND_TYPES, {
    message: 'Type must be one of: trading, emergency, savings, other',
  }),
  date: z
    .string()
    .datetime({ message: 'Invalid date. Use ISO 8601 format' })
    .transform((val) => new Date(val)),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  notes: z
    .string()
    .max(500, 'Notes must be at most 500 characters')
    .trim()
    .optional(),
})

export type AddFundInput = z.infer<typeof AddFundSchema>
export type FundType = (typeof FUND_TYPES)[number]

// ── Response Types ────────────────────────────────────────────────────────────

export interface Fund {
  _id: string
  name: string
  type: FundType
  date: string
  amount: number
  notes?: string
  createdAt: string
}

export interface FundsSummary {
  totalFunds: number
  totalEntries: number
  byType: Record<FundType, number>
}

export interface FundsResponse {
  summary: FundsSummary
  data: Fund[]
}
