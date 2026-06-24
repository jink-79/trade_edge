import { MutualFund } from "./mutual-funds.model";
import type {
  MutualFundsQuery,
  MutualFundsResponse,
  MutualFundEntry,
} from "./mutual-funds.types";

function formatEntry(doc: any): MutualFundEntry {
  return {
    id: String(doc._id),
    date: doc.date,
    fundName: doc.fundName,
    category: doc.category,
    nav: doc.nav,
    units: doc.units,
    amount: doc.amount,
  };
}

export async function getMutualFunds(
  query: MutualFundsQuery,
): Promise<MutualFundsResponse> {
  const { category, page, limit } = query;
  const skip = (page - 1) * limit;

  // Build filter — category is optional
  const filter: Record<string, unknown> = {};
  if (category) {
    filter.category = { $regex: new RegExp(category, "i") };
  }

  const [entries, total] = await Promise.all([
    MutualFund.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    MutualFund.countDocuments(filter),
  ]);

  return {
    entries: entries.map(formatEntry),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
