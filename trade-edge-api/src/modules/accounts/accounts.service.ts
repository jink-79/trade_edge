import { Types } from "mongoose";
import { AppError } from "../../utils/api-error";
import { Account, Snapshot, type IAccount, type ISnapshot } from "./accounts.model";
import type {
  AccountDetailDto,
  AccountDto,
  CreateAccountInput,
  SnapshotDto,
  SnapshotRowDto,
  UpdateAccountInput,
  UpsertSnapshotInput,
  SaveMonthInput,
} from "./accounts.types";

function toSnapshotDto(s: Pick<ISnapshot, "month" | "value" | "invested">): SnapshotDto {
  return { month: s.month, value: s.value, invested: s.invested ?? null };
}

function toAccountDto(a: IAccount, latest: SnapshotDto | null): AccountDto {
  return {
    id: String(a._id),
    type: a.type,
    name: a.name,
    institution: a.institution ?? null,
    mfCategory: a.mfCategory ?? null,
    closed: a.closed,
    createdAt: a.createdAt,
    latest,
  };
}

/** Loads an account and checks it belongs to the user. */
async function findOwned(userId: string, id: string): Promise<IAccount> {
  const account = await Account.findOne({ _id: id, userId });
  if (!account) throw AppError.notFound("Account not found");
  return account;
}

export async function listAccounts(userId: string): Promise<AccountDto[]> {
  const uid = new Types.ObjectId(userId);
  const [accounts, latest] = await Promise.all([
    Account.find({ userId: uid }).sort({ type: 1, name: 1 }),
    Snapshot.aggregate<{ _id: Types.ObjectId; month: string; value: number; invested?: number }>([
      { $match: { userId: uid } },
      { $sort: { month: -1 } },
      {
        $group: {
          _id: "$accountId",
          month: { $first: "$month" },
          value: { $first: "$value" },
          invested: { $first: "$invested" },
        },
      },
    ]),
  ]);

  const latestById = new Map(latest.map((s) => [String(s._id), toSnapshotDto(s)]));
  return accounts.map((a) => toAccountDto(a, latestById.get(String(a._id)) ?? null));
}

/** Every month of every account, oldest first — the Home screen builds its trend from this. */
export async function listAllSnapshots(userId: string): Promise<SnapshotRowDto[]> {
  const rows = await Snapshot.find({ userId: new Types.ObjectId(userId) })
    .sort({ month: 1 })
    .select("accountId month value invested")
    .lean();
  return rows.map((r) => ({ accountId: String(r.accountId), ...toSnapshotDto(r) }));
}

export async function getAccount(userId: string, id: string): Promise<AccountDetailDto> {
  const account = await findOwned(userId, id);
  const snapshots = await Snapshot.find({ accountId: account._id }).sort({ month: -1 }).lean();
  const dtos = snapshots.map(toSnapshotDto);
  return { ...toAccountDto(account, dtos[0] ?? null), snapshots: dtos };
}

export async function createAccount(
  userId: string,
  input: CreateAccountInput,
): Promise<AccountDetailDto> {
  const { month, value, invested, mfCategory, ...rest } = input;
  const account = await Account.create({
    ...rest,
    mfCategory: input.type === "mf" ? mfCategory : undefined,
    userId: new Types.ObjectId(userId),
  });
  try {
    await Snapshot.create({
      userId: account.userId,
      accountId: account._id,
      month,
      value,
      invested: input.type === "mf" || input.type === "stock" ? invested : undefined,
    });
  } catch (err) {
    await account.deleteOne(); // don't leave an account with no opening value
    throw err;
  }
  return getAccount(userId, String(account._id));
}

export async function updateAccount(
  userId: string,
  id: string,
  input: UpdateAccountInput,
): Promise<AccountDetailDto> {
  const account = await findOwned(userId, id);
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};
  for (const [key, val] of Object.entries(input)) {
    if (val === null) $unset[key] = 1;
    else $set[key] = val;
  }
  const update: Record<string, unknown> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  await Account.updateOne({ _id: account._id }, update, { runValidators: true });
  return getAccount(userId, id);
}

export async function deleteAccount(userId: string, id: string): Promise<void> {
  const account = await findOwned(userId, id);
  await Snapshot.deleteMany({ accountId: account._id });
  await account.deleteOne();
}

export async function upsertSnapshot(
  userId: string,
  id: string,
  month: string,
  input: UpsertSnapshotInput,
): Promise<AccountDetailDto> {
  const account = await findOwned(userId, id);
  const tracksInvested = account.type === "mf" || account.type === "stock";
  const update: Record<string, unknown> = { $set: { value: input.value } };
  if (tracksInvested && typeof input.invested === "number") {
    (update.$set as Record<string, unknown>).invested = input.invested;
  } else if (input.invested === null || !tracksInvested) {
    update.$unset = { invested: 1 };
  }
  await Snapshot.updateOne(
    { accountId: account._id, month },
    { ...update, $setOnInsert: { userId: account.userId } },
    { upsert: true, runValidators: true },
  );
  return getAccount(userId, id);
}

export async function deleteSnapshot(
  userId: string,
  id: string,
  month: string,
): Promise<AccountDetailDto> {
  const account = await findOwned(userId, id);
  const count = await Snapshot.countDocuments({ accountId: account._id });
  if (count <= 1) {
    throw AppError.badRequest("An account needs at least one month. Delete the account instead.");
  }
  await Snapshot.deleteOne({ accountId: account._id, month });
  return getAccount(userId, id);
}

/** Saves one month for many accounts at once (the monthly Update screen). */
export async function saveMonth(
  userId: string,
  month: string,
  { entries }: SaveMonthInput,
): Promise<{ saved: number }> {
  const ids = entries.map((e) => e.accountId);
  const accounts = await Account.find({ _id: { $in: ids }, userId });
  if (accounts.length !== ids.length) throw AppError.badRequest("One of the accounts wasn't found.");
  const byId = new Map(accounts.map((a) => [String(a._id), a]));

  await Snapshot.bulkWrite(
    entries.map((e) => {
      const account = byId.get(e.accountId)!;
      const tracksInvested = account.type === "mf" || account.type === "stock";
      const $set: Record<string, unknown> = { value: e.value };
      const update: Record<string, unknown> = { $set, $setOnInsert: { userId: account.userId } };
      if (tracksInvested && typeof e.invested === "number") $set.invested = e.invested;
      else if (!tracksInvested || e.invested === null) update.$unset = { invested: 1 };
      return {
        updateOne: { filter: { accountId: account._id, month }, update, upsert: true },
      };
    }),
  );
  return { saved: entries.length };
}
