import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendCreated, sendSuccess } from "../../utils/api-response";
import * as service from "./possessions.service";
import type { CreatePossessionInput, UpdatePossessionInput } from "./possessions.types";

const uid = (req: Request) => req.user!.userId;
const idOf = (req: Request) => (req as unknown as { parsedParams: { id: string } }).parsedParams.id;

export const list = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.listPossessions(uid(req)), "Possessions fetched");
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreatePossessionInput;
  sendCreated(res, await service.createPossession(uid(req), input), "Item added");
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdatePossessionInput;
  sendSuccess(res, await service.updatePossession(uid(req), idOf(req), input), "Item updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deletePossession(uid(req), idOf(req));
  sendSuccess(res, null, "Item removed");
});
