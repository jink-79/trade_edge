import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { refreshAllMarksFromOhlcv, syncKitePositions } from "./broker-sync.service";
import type { KiteSyncInput } from "./broker-sync.types";

// POST /api/broker-sync/kite — sync a Kite positions/holdings snapshot into the journal
export const sync = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as KiteSyncInput;
  const result = await syncKitePositions(userId, input);
  sendSuccess(res, result, "Kite positions synced");
});

// GET /api/broker-sync/refresh-marks — cron-only, Kite-free daily mark-to-market
export const refreshMarks = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await refreshAllMarksFromOhlcv();
  sendSuccess(res, summary, "Marks refreshed from OHLCV");
});
