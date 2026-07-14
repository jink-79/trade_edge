import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess, sendCreated } from "../../utils/api-response";
import { getMutualFunds, createMutualFund } from "./mutual-funds.service";
import type {
  MutualFundsQuery,
  CreateMutualFundInput,
} from "./mutual-funds.types";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const query = (req as any).parsedQuery as MutualFundsQuery;
  const result = await getMutualFunds(query);
  sendSuccess(res, result, "Mutual funds fetched successfully");
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as CreateMutualFundInput;
  const entry = await createMutualFund(userId, input);
  sendCreated(res, entry, "Mutual fund entry added successfully");
});
