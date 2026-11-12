import { Types } from "mongoose";
import { AppError } from "../../utils/api-error";
import { Possession, type IPossession } from "./possessions.model";
import type { CreatePossessionInput, PossessionDto, UpdatePossessionInput } from "./possessions.types";

function toDto(p: IPossession): PossessionDto {
  return {
    id: String(p._id),
    name: p.name,
    category: p.category,
    purchasePrice: p.purchasePrice,
    purchaseMonth: p.purchaseMonth,
    yearlyDropPct: p.yearlyDropPct,
    createdAt: p.createdAt,
  };
}

async function findOwned(userId: string, id: string): Promise<IPossession> {
  const p = await Possession.findOne({ _id: id, userId });
  if (!p) throw AppError.notFound("Item not found");
  return p;
}

export async function listPossessions(userId: string): Promise<PossessionDto[]> {
  const rows = await Possession.find({ userId: new Types.ObjectId(userId) }).sort({ purchaseMonth: -1 });
  return rows.map(toDto);
}

export async function createPossession(userId: string, input: CreatePossessionInput): Promise<PossessionDto> {
  const p = await Possession.create({ ...input, userId: new Types.ObjectId(userId) });
  return toDto(p);
}

export async function updatePossession(
  userId: string,
  id: string,
  input: UpdatePossessionInput,
): Promise<PossessionDto> {
  const p = await findOwned(userId, id);
  p.set(input);
  await p.save();
  return toDto(p);
}

export async function deletePossession(userId: string, id: string): Promise<void> {
  const p = await findOwned(userId, id);
  await p.deleteOne();
}
