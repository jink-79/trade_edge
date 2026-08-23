import { Fund } from './funds.model'
import { AppError } from '../../utils/api-error'
import { FUND_TYPES } from './funds.types'
import { JournalOpen, JournalClosed } from '../journal/journal.model'
import type {
  AddFundInput,
  Fund as FundType,
  FundsSummary,
  FundsResponse,
  FundsStatementResponse,
  StatementEntry,
  StatementEntryType,
} from './funds.types'

const round2 = (n: number) => Math.round(n * 100) / 100

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
    JournalClosed.find({ userId }).select('pnlAmount netPnlAmount').lean(),
  ])
  const totalOpenInvested = openTrades.reduce(
    (sum, t: any) => sum + (t.entryPrice ?? 0) * (t.quantity ?? 0),
    0,
  )
  // net (charges-aware), not gross — matches the statement's own sell rows
  const totalRealizedPnl = closedTrades.reduce(
    (sum, t: any) => sum + (t.netPnlAmount ?? t.pnlAmount ?? 0),
    0,
  )
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

interface RawEntry {
  date: Date
  type: StatementEntryType
  description: string
  symbol: string | null
  debit: number | null
  credit: number | null
  pnl: number | null
  /** The real Mongo _id behind this row — Fund._id for a deposit, trade._id
   * for a buy/sell — so a deposit row can still be deleted from the
   * statement even though the row itself is synthesized, not stored. */
  refId: string
}

/**
 * Zerodha-style running statement — NOT a stored ledger. Synthesized from
 * two real sources: Fund deposits (credit) and every journal trade's entry
 * (debit, money committed to a buy) and exit if it has one (credit, net
 * proceeds after charges, with the realized P&L shown alongside). A partial
 * exit already lives as its own JournalClosed doc with its own sliced
 * entry.quantity/entryPrice (the remainder stays on the JournalOpen doc), so
 * iterating every open + closed doc's own entry naturally reconstructs the
 * full buy history without double-counting.
 */
export async function getFundsStatement(userId: string): Promise<FundsStatementResponse> {
  const [funds, openTrades, closedTrades] = await Promise.all([
    Fund.find({ userId }).lean(),
    JournalOpen.find({ userId }).lean(),
    JournalClosed.find({ userId }).lean(),
  ])

  const raw: RawEntry[] = []

  for (const f of funds as any[]) {
    raw.push({
      date: new Date(f.date),
      type: 'deposit',
      description: `Deposit — ${f.name}`,
      symbol: null,
      debit: null,
      credit: round2(f.amount),
      pnl: null,
      refId: String(f._id),
    })
  }

  for (const t of [...openTrades, ...closedTrades] as any[]) {
    const entry = t.entry
    const tradeId = String(t._id)
    raw.push({
      date: new Date(entry.entryDate),
      type: 'buy',
      description: `Bought ${entry.quantity} ${entry.ticker} @ ₹${entry.entryPrice}`,
      symbol: entry.ticker,
      debit: round2(entry.entryPrice * entry.quantity),
      credit: null,
      pnl: null,
      refId: tradeId,
    })

    const exit = t.exit
    if (exit) {
      const qty = exit.quantity ?? entry.quantity
      const netPnl = exit.netPnlAmount ?? t.pnlAmount ?? 0
      const proceeds = round2(exit.exitPrice * qty - (exit.charges?.totalCharges ?? 0))
      raw.push({
        date: new Date(exit.exitDate),
        type: 'sell',
        description: `Sold ${qty} ${entry.ticker} @ ₹${exit.exitPrice}`,
        symbol: entry.ticker,
        debit: null,
        credit: proceeds,
        pnl: round2(netPnl),
        refId: tradeId,
      })
    }
  }

  raw.sort((a, b) => a.date.getTime() - b.date.getTime())

  let balance = 0
  const chronological: StatementEntry[] = raw.map((r) => {
    balance = round2(balance + (r.credit ?? 0) - (r.debit ?? 0))
    return {
      id: `${r.type}-${r.refId}`,
      date: r.date.toISOString(),
      type: r.type,
      description: r.description,
      symbol: r.symbol,
      debit: r.debit,
      credit: r.credit,
      pnl: r.pnl,
      balance,
      refId: r.type === 'deposit' ? r.refId : null,
    }
  })

  const totalDeposits = round2(
    raw.filter((r) => r.type === 'deposit').reduce((s, r) => s + (r.credit ?? 0), 0),
  )
  const totalBuys = round2(
    raw.filter((r) => r.type === 'buy').reduce((s, r) => s + (r.debit ?? 0), 0),
  )
  const totalSells = round2(
    raw.filter((r) => r.type === 'sell').reduce((s, r) => s + (r.credit ?? 0), 0),
  )
  const totalRealizedPnl = round2(
    raw.filter((r) => r.type === 'sell').reduce((s, r) => s + (r.pnl ?? 0), 0),
  )

  return {
    openingBalance: 0,
    closingBalance: chronological.length ? chronological[chronological.length - 1].balance : 0,
    totalDeposits,
    totalBuys,
    totalSells,
    totalRealizedPnl,
    entries: [...chronological].reverse(),
  }
}
