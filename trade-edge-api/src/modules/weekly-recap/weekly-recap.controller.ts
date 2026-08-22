import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { getWeeklyRecap, generateWeeklyRecapSummary } from "./weekly-recap.service";

function weekStartParam(req: Request): string | undefined {
  return typeof req.query.weekStart === "string" ? req.query.weekStart : undefined;
}

// GET /api/weekly-recap?weekStart=
export const getRecap = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await getWeeklyRecap(userId, weekStartParam(req));
  sendSuccess(res, result, "Weekly recap loaded");
});

// POST /api/weekly-recap/generate?weekStart=
export const generateRecap = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await generateWeeklyRecapSummary(userId, weekStartParam(req));
  sendSuccess(res, result, "Weekly recap generated");
});
