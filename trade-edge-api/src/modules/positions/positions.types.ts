import { z } from 'zod'

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const CreatePositionSchema = z.object({
  stockName: z
    .string()
    .min(1, 'Stock name is required')
    .max(100, 'Stock name must be at most 100 characters')
    .trim(),
  stockSymbol: z
    .string()
    .min(1, 'Stock symbol is required')
    .max(20, 'Stock symbol must be at most 20 characters')
    .trim()
    .toUpperCase(),
  sector: z
    .string()
    .min(1, 'Sector is required')
    .max(100, 'Sector must be at most 100 characters')
    .trim(),
  tradeDate: z.string().datetime({ message: 'Invalid date format. Use ISO 8601 (e.g. 2024-01-15T00:00:00.000Z)' }).transform((val) => new Date(val)),
  side: z.enum(['long', 'short'], { message: 'Side must be either long or short' }),
  entryPrice: z
    .number({ error: 'Entry price must be a number' })
    .positive('Entry price must be greater than 0'),
  quantity: z
    .number({ error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  timeframe: z.enum(['daily', 'weekly', 'monthly'], {
    message: 'Timeframe must be daily, weekly or monthly',
  }),
  notes: z.string().max(500, 'Notes must be at most 500 characters').trim().optional(),
})

// ── Exit Schema ───────────────────────────────────────────────────────────────

export const ExitPositionSchema = z.object({
  exitPrice: z.number().positive('Exit price must be greater than 0'),
  charges: z.number().min(0, 'Charges cannot be negative').default(0),
  exitReason: z
    .string()
    .min(1, 'Exit reason is required')
    .max(100, 'Exit reason must be at most 100 characters')
    .trim(),
  exitDate: z.coerce.date().optional(),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').trim().optional(),
})

export type ExitPositionInput = z.infer<typeof ExitPositionSchema>

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CreatePositionInput = z.infer<typeof CreatePositionSchema>

// ── Response Types ────────────────────────────────────────────────────────────

export interface Position {
  id: string
  userId: string
  stockName: string
  stockSymbol: string
  sector: string
  tradeDate: Date
  side: 'long' | 'short'
  entryPrice: number
  quantity: number
  investedAmount: number   // entryPrice * quantity — computed on save
  timeframe: 'daily' | 'weekly' | 'monthly'
  notes?: string
  // ── Weekly market snapshot (null until the sync script runs) ──
  lastClosedWeeklyClose: number | null
  highestCloseSinceEntry: number | null
  structureExitLow: number | null
  trailingActive: boolean
  trailingStopPrice: number | null
  trailActivatedDate: Date | null
  exitSignal: boolean
  exitReason: string | null
  lastCandleDate: Date | null
  pnlPercent: number | null
  lastSyncedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
