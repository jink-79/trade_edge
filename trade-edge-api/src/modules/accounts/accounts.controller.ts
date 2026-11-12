import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendCreated, sendSuccess } from "../../utils/api-response";
import * as service from "./accounts.service";
import type {
  CreateAccountInput,
  UpdateAccountInput,
  UpsertSnapshotInput,
} from "./accounts.types";

type IdParams = { id: string };
type SnapParams = { id: string; month: string };

const uid = (req: Request) => req.user!.userId;
const params = <T>(req: Request) => (req as unknown as { parsedParams: T }).parsedParams;

export const list = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.listAccounts(uid(req)), "Accounts fetched");
});

export const snapshots = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.listAllSnapshots(uid(req)), "Snapshots fetched");
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = params<IdParams>(req);
  sendSuccess(res, await service.getAccount(uid(req), id), "Account fetched");
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateAccountInput;
  sendCreated(res, await service.createAccount(uid(req), input), "Account added");
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = params<IdParams>(req);
  const input = req.body as UpdateAccountInput;
  sendSuccess(res, await service.updateAccount(uid(req), id, input), "Account updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = params<IdParams>(req);
  await service.deleteAccount(uid(req), id);
  sendSuccess(res, null, "Account deleted");
});

export const upsertSnapshot = asyncHandler(async (req: Request, res: Response) => {
  const { id, month } = params<SnapParams>(req);
  const input = req.body as UpsertSnapshotInput;
  sendSuccess(res, await service.upsertSnapshot(uid(req), id, month, input), "Month saved");
});

export const removeSnapshot = asyncHandler(async (req: Request, res: Response) => {
  const { id, month } = params<SnapParams>(req);
  sendSuccess(res, await service.deleteSnapshot(uid(req), id, month), "Month removed");
});
