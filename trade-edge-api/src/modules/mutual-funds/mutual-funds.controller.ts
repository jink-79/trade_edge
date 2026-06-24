import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { getMutualFunds } from "./mutual-funds.service";
import type { MutualFundsQuery } from "./mutual-funds.types";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const query = (req as any).parsedQuery as MutualFundsQuery;
  const result = await getMutualFunds(query);
  sendSuccess(res, result, "Mutual funds fetched successfully");
});
