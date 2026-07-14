import { Fund } from './funds.model'
import { AppError } from '../../utils/api-error'
import { FUND_TYPES } from './funds.types'
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

function buildSummary(funds: FundType[]): FundsSummary {
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
  }
}

export async function getFunds(userId: string): Promise<FundsResponse> {
  const docs = await Fund.find({ userId }).sort({ date: -1 }).lean()
  const funds = docs.map(formatFund)
  const summary = buildSummary(funds)
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
