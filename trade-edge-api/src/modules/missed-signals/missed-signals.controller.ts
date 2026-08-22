import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { getMissedSignals } from "./missed-signals.service";

// GET /api/missed-signals?days=
export const listMissedSignals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const days = req.query.days != null ? Number(req.query.days) : 30;
  const result = await getMissedSignals(userId, Number.isFinite(days) ? days : 30);
  sendSuccess(res, result, "Missed signals loaded");
});
