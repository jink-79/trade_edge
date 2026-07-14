import { Trade } from './trades.model'
import { AppError } from '../../utils/api-error'
import type { CreateTradeInput, Trade as TradeType } from './trades.types'

// ── Computation helpers ───────────────────────────────────────────────────────

function computePnlPercent(entryPrice: number, exitPrice: number): number {
  return parseFloat((((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2))
}

function computePnlAmount(entryPrice: number, exitPrice: number, qty: number): number {
  return parseFloat(((exitPrice - entryPrice) * qty).toFixed(2))
}

// ── Formatter ─────────────────────────────────────────────────────────────────

function formatTrade(doc: any): TradeType {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    symbol: doc.symbol,
    stockName: doc.stockName,
    // Fields not present in the Python `closedpositions` shape get safe defaults
    sector: doc.sector ?? "—",
    qty: doc.qty,
    entryPrice: doc.entryPrice,
    exitPrice: doc.exitPrice,
    entryDate: doc.entryDate,
    exitDate: doc.exitDate,
    highestCloseSinceEntry: doc.highestCloseSinceEntry ?? doc.exitPrice,
    structureExitLow: doc.structureExitLow ?? doc.trailingStopPrice ?? 0,
    trailingStopPrice: doc.trailingStopPrice ?? null,
    exitReason: doc.exitReason,
    pnlPercent: doc.pnlPercent,
    pnlAmount: doc.pnlAmount,
    rMultiple: doc.rMultiple ?? null,
    thesis: doc.thesis ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function createTrade(userId: string, input: CreateTradeInput): Promise<TradeType> {
  const pnlPercent = computePnlPercent(input.entryPrice, input.exitPrice)
  const pnlAmount = computePnlAmount(input.entryPrice, input.exitPrice, input.qty)

  const trade = await Trade.create({
    ...input,
    userId,
    pnlPercent,
    pnlAmount,
    rMultiple: null,
  })

  return formatTrade(trade)
}

export async function getTradesByUser(userId: string): Promise<TradeType[]> {
  const trades = await Trade.find({ userId }).sort({ exitDate: -1 }).lean()
  return trades.map(formatTrade)
}

export async function getTradeById(id: string, userId: string): Promise<TradeType> {
  const trade = await Trade.findOne({ _id: id, userId }).lean()

  if (!trade) {
    throw AppError.notFound('Trade not found')
  }

  return formatTrade(trade)
}
