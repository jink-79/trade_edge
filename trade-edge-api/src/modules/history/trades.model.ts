import { Schema, model, Document } from 'mongoose'

export interface ITrade extends Document {
  // Stored as a string in the Python-populated `closedpositions` collection
  userId: string
  symbol: string
  stockName: string
  sector: string
  qty: number
  entryPrice: number
  exitPrice: number
  entryDate: Date
  exitDate: Date
  highestCloseSinceEntry: number | null
  structureExitLow: number | null
  trailingStopPrice: number | null
  exitReason: string
  pnlPercent: number
  pnlAmount: number
  rMultiple: number | null
  thesis?: string
  // Populated on manual exit (also present on Python-written docs)
  charges?: number
  entryValue?: number | null
  exitValue?: number | null
  holdingDays?: number | null
  createdAt: Date
  updatedAt: Date
}

const TradeSchema = new Schema<ITrade>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      trim: true,
      uppercase: true,
      maxlength: [20, 'Symbol must be at most 20 characters'],
    },
    stockName: {
      type: String,
      required: [true, 'Stock name is required'],
      trim: true,
      maxlength: [100, 'Stock name must be at most 100 characters'],
    },
    sector: {
      type: String,
      required: [true, 'Sector is required'],
      trim: true,
      maxlength: [100, 'Sector must be at most 100 characters'],
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    entryPrice: {
      type: Number,
      required: [true, 'Entry price is required'],
      min: [0, 'Entry price cannot be negative'],
    },
    exitPrice: {
      type: Number,
      required: [true, 'Exit price is required'],
      min: [0, 'Exit price cannot be negative'],
    },
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
    },
    exitDate: {
      type: Date,
      required: [true, 'Exit date is required'],
    },
    // Optional — the Python `openpositions`/`closedpositions` docs may omit these
    highestCloseSinceEntry: { type: Number, default: null },
    structureExitLow: { type: Number, default: null },
    trailingStopPrice: { type: Number, default: null },
    exitReason: {
      type: String,
      required: [true, 'Exit reason is required'],
      trim: true,
      maxlength: [100, 'Exit reason must be at most 100 characters'],
    },
    // Server-computed fields
    pnlPercent: {
      type: Number,
      required: true,
    },
    pnlAmount: {
      type: Number,
      required: true,
    },
    rMultiple: {
      type: Number,
      default: null,
    },
    thesis: {
      type: String,
      trim: true,
      maxlength: [1000, 'Thesis must be at most 1000 characters'],
    },
    charges: { type: Number, default: 0 },
    entryValue: { type: Number, default: null },
    exitValue: { type: Number, default: null },
    holdingDays: { type: Number, default: null },
  },
  {
    timestamps: true,
    // Read/write the Python-populated closed-trades collection
    collection: 'closedpositions',
  }
)

export const Trade = model<ITrade>('Trade', TradeSchema)
