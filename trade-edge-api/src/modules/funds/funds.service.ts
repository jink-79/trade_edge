import { Fund } from './funds.model'
import { AppError } from '../../utils/api-error'
import { FUND_TYPES } from './funds.types'
import { JournalOpen, JournalClosed } from '../journal/journal.model'
import type { AddFundInput, Fund as FundType, FundsSummary, FundsResponse } from './funds.types'

function formatFund(doc: any): FundType {
  return {
    _id: String(doc._id),
    name: doc.name,
    type: doc.type,
    date: doc.date.toISOString(),
    amount: doc.amount,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
  }
}

function buildSummary(funds: FundType[], availableCash: number): FundsSummary {
  // Initialise every type to 0 so the frontend always gets all keys
  const byType = Object.fromEntries(FUND_TYPES.map((t) => [t, 0])) as Record<string, number>

  let totalFunds = 0
  for (const fund of funds) {
    totalFunds += fund.amount
    byType[fund.type] += fund.amount
  }

  return {
    totalFunds,
    totalEntries: funds.length,
    byType: byType as FundsSummary['byType'],
    availableCash: Math.round((totalFunds + availableCash) * 100) / 100,
  }
}

/**
 * Deliberately NOT stored — Funds stays a pure deposit/withdrawal ledger
 * (amount can't be negative). "Available cash" is derived on read:
 * totalFunds − (money currently tied up in open positions) + (realized P&L
 * from closed trades, which isn't reflected in the deposit ledger at all).
 * Returns the open-invested/realized-P&L delta only (caller adds totalFunds).
 */
export async function computeCashDelta(userId: string): Promise<number> {
  const [openTrades, closedTrades] = await Promise.all([
    JournalOpen.find({ userId }).select('entryPrice quantity').lean(),
    JournalClosed.find({ userId }).select('pnlAmount').lean(),
  ])
  const totalOpenInvested = openTrades.reduce(
    (sum, t: any) => sum + (t.entryPrice ?? 0) * (t.quantity ?? 0),
    0,
  )
  const totalRealizedPnl = closedTrades.reduce((sum, t: any) => sum + (t.pnlAmount ?? 0), 0)
  return totalRealizedPnl - totalOpenInvested
}

export async function getFunds(userId: string): Promise<FundsResponse> {
  const [docs, cashDelta] = await Promise.all([
    Fund.find({ userId }).sort({ date: -1 }).lean(),
    computeCashDelta(userId),
  ])
  const funds = docs.map(formatFund)
  const summary = buildSummary(funds, cashDelta)
  return { summary, data: funds }
}

export async function addFund(userId: string, input: AddFundInput): Promise<FundType> {
  const fund = await Fund.create({ ...input, userId })
  return formatFund(fund)
}

export async function deleteFund(id: string, userId: string): Promise<void> {
  const fund = await Fund.findOneAndDelete({ _id: id, userId })

  if (!fund) {
    throw AppError.notFound('Fund entry not found')
  }
}
