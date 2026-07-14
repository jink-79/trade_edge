import mongoose from 'mongoose'
import { Position } from './positions.model'
import { Trade } from '../history/trades.model'
import { AppError } from '../../utils/api-error'
import type {
  CreatePositionInput,
  ExitPositionInput,
  Position as PositionType,
} from './positions.types'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function formatPosition(doc: any): PositionType {
  // The Python `openpositions` docs use symbol/entryDate/qty and omit
  // side/timeframe/sector/investedAmount. Manually-added docs use the app's
  // names. Read both, defaulting the fields the scanner doesn't provide.
  const quantity = doc.quantity ?? doc.qty ?? 0
  const entryPrice = doc.entryPrice ?? 0
  return {
    id: String(doc._id),
    userId: doc.userId ? String(doc.userId) : '',
    stockName: doc.stockName,
    stockSymbol: doc.stockSymbol ?? doc.symbol ?? '',
    sector: doc.sector ?? '—',
    tradeDate: doc.tradeDate ?? doc.entryDate,
    side: doc.side ?? 'long',
    entryPrice,
    quantity,
    investedAmount: doc.investedAmount ?? entryPrice * quantity,
    timeframe: doc.timeframe ?? 'weekly',
    notes: doc.notes,
    lastClosedWeeklyClose: doc.lastClosedWeeklyClose ?? null,
    highestCloseSinceEntry: doc.highestCloseSinceEntry ?? null,
    structureExitLow: doc.structureExitLow ?? null,
    trailingActive: doc.trailingActive ?? false,
    trailingStopPrice: doc.trailingStopPrice ?? null,
    trailActivatedDate: doc.trailActivatedDate ?? null,
    exitSignal: doc.exitSignal ?? false,
    exitReason: doc.exitReason ?? null,
    lastCandleDate: doc.lastCandleDate ?? null,
    pnlPercent: doc.pnlPercent ?? null,
    // openpositions has no explicit sync stamp — updatedAt tracks the last write
    lastSyncedAt: doc.lastSyncedAt ?? doc.updatedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function createPosition(
  userId: string,
  input: CreatePositionInput
): Promise<PositionType> {
  const investedAmount = input.entryPrice * input.quantity

  const position = await Position.create({
    ...input,
    userId,
    investedAmount,
  })

  return formatPosition(position)
}

// The openpositions collection has no userId field, so positions are not
// user-scoped (single-user journal). Return all, newest first.
export async function getPositions(): Promise<PositionType[]> {
  const positions = await Position.find({}).sort({ createdAt: -1 }).lean()
  return positions.map(formatPosition)
}

export async function getPositionById(id: string): Promise<PositionType> {
  const position = await Position.findById(id).lean()

  if (!position) {
    throw AppError.notFound('Position not found')
  }

  return formatPosition(position)
}

export interface ExitResult {
  id: string
  symbol: string
  pnlAmount: number
  pnlPercent: number
  holdingDays: number
}

/**
 * Closes an open position: computes realised P&L, writes a record into the
 * closed-trades (history) collection, and removes it from open positions —
 * atomically, so a partial failure can't duplicate or drop the trade.
 */
export async function exitPosition(
  userId: string,
  id: string,
  input: ExitPositionInput,
): Promise<ExitResult> {
  const pos: any = await Position.findById(id).lean()
  if (!pos) {
    throw AppError.notFound('Open position not found')
  }

  // Read native (scanner) or app field names
  const symbol = pos.stockSymbol ?? pos.symbol ?? ''
  const qty = pos.quantity ?? pos.qty ?? 0
  const entryPrice = pos.entryPrice ?? 0
  const entryDate = pos.tradeDate ?? pos.entryDate ?? pos.createdAt
  const sideMul = (pos.side ?? 'long') === 'short' ? -1 : 1

  const exitPrice = input.exitPrice
  const charges = input.charges ?? 0
  const exitDate = input.exitDate ?? new Date()

  const entryValue = entryPrice * qty
  const exitValue = exitPrice * qty
  const gross = (exitPrice - entryPrice) * qty * sideMul
  const pnlAmount = round2(gross - charges)
  const pnlPercent = entryValue > 0 ? round2((pnlAmount / entryValue) * 100) : 0
  const holdingDays = Math.max(
    0,
    Math.floor(
      (new Date(exitDate).getTime() - new Date(entryDate).getTime()) / 86400000,
    ),
  )

  // R-multiple from the initial (structure-low) stop — long-only breakouts
  const structureExitLow = pos.structureExitLow ?? null
  const riskPerShare =
    structureExitLow != null ? entryPrice - structureExitLow : null
  const rMultiple =
    sideMul === 1 && riskPerShare != null && riskPerShare > 0
      ? round2((exitPrice - entryPrice) / riskPerShare)
      : null

  const closedDoc = {
    userId,
    symbol,
    stockName: pos.stockName ?? symbol,
    sector: pos.sector ?? 'Unknown',
    qty,
    entryPrice,
    exitPrice,
    entryDate,
    exitDate,
    highestCloseSinceEntry: pos.highestCloseSinceEntry ?? null,
    structureExitLow,
    trailingStopPrice: pos.trailingStopPrice ?? null,
    exitReason: input.exitReason,
    pnlPercent,
    pnlAmount,
    rMultiple,
    thesis: input.notes,
    charges,
    entryValue: round2(entryValue),
    exitValue: round2(exitValue),
    holdingDays,
  }

  const session = await mongoose.startSession()
  let createdId = ''
  try {
    await session.withTransaction(async () => {
      const docs = await Trade.create([closedDoc], { session })
      createdId = String(docs[0]._id)
      await Position.deleteOne({ _id: id }, { session })
    })
  } finally {
    await session.endSession()
  }

  return { id: createdId, symbol, pnlAmount, pnlPercent, holdingDays }
}
