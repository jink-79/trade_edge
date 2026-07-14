import { z } from 'zod'

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const CreateTradeSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be at most 20 characters')
    .trim()
    .toUpperCase(),
  stockName: z
    .string()
    .min(1, 'Stock name is required')
    .max(100, 'Stock name must be at most 100 characters')
    .trim(),
  sector: z
    .string()
    .min(1, 'Sector is required')
    .max(100, 'Sector must be at most 100 characters')
    .trim(),
  qty: z
    .number({ error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  entryPrice: z
    .number({ error: 'Entry price must be a number' })
    .positive('Entry price must be greater than 0'),
  exitPrice: z
    .number({ error: 'Exit price must be a number' })
    .positive('Exit price must be greater than 0'),
  entryDate: z
    .string()
    .datetime({ message: 'Invalid entry date. Use ISO 8601 format' })
    .transform((val) => new Date(val)),
  exitDate: z
    .string()
    .datetime({ message: 'Invalid exit date. Use ISO 8601 format' })
    .transform((val) => new Date(val)),
  highestCloseSinceEntry: z
    .number({ error: 'Highest close must be a number' })
    .positive('Highest close must be greater than 0'),
  structureExitLow: z
    .number({ error: 'Structure exit low must be a number' })
    .positive('Structure exit low must be greater than 0'),
  trailingStopPrice: z
    .number({ error: 'Trailing stop price must be a number' })
    .positive('Trailing stop price must be greater than 0'),
  exitReason: z
    .string()
    .min(1, 'Exit reason is required')
    .max(100, 'Exit reason must be at most 100 characters')
    .trim(),
  thesis: z
    .string()
    .max(1000, 'Thesis must be at most 1000 characters')
    .trim()
    .optional(),
}).refine((data) => data.exitDate >= data.entryDate, {
  message: 'Exit date cannot be before entry date',
  path: ['exitDate'],
})

export type CreateTradeInput = z.infer<typeof CreateTradeSchema>

// ── Response Types ────────────────────────────────────────────────────────────

export interface Trade {
  id: string
  userId: string
  symbol: string
  stockName: string
  sector: string
  qty: number
  entryPrice: number
  exitPrice: number
  entryDate: Date
  exitDate: Date
  highestCloseSinceEntry: number
  structureExitLow: number
  trailingStopPrice: number
  exitReason: string
  pnlPercent: number       // computed: ((exitPrice - entryPrice) / entryPrice) * 100
  pnlAmount: number        // computed: (exitPrice - entryPrice) * qty
  rMultiple: number | null // null until stopLoss at entry is tracked
  thesis?: string
  createdAt: Date
  updatedAt: Date
}
