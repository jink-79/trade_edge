import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { getLatestDailySnapshot, listDailySnapshots, syncKitePositions } from "./broker-sync.service";
import type { KiteSyncInput } from "./broker-sync.types";

// POST /api/broker-sync/kite — sync a Kite positions/holdings snapshot into the journal
export const sync = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as KiteSyncInput;
  const result = await syncKitePositions(userId, input);
  sendSuccess(res, result, "Kite positions synced");
});

// GET /api/broker-sync/daily-pnl/latest
export const latestSnapshot = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const snapshot = await getLatestDailySnapshot(userId);
  sendSuccess(res, snapshot, snapshot ? "Latest daily P&L fetched" : "No daily P&L snapshot yet");
});

// GET /api/broker-sync/daily-pnl?from=&to=&limit=
export const listSnapshots = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { from, to, limit } = req.query;
  const snapshots = await listDailySnapshots(userId, {
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  sendSuccess(res, snapshots, "Daily P&L history fetched");
});
