import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import {
  getLatestDailySignal,
  getLatestWeeklySignal,
  listDailySignals,
  listWeeklySignals,
} from "./algo-signals.service";

function parseRange(req: Request) {
  const { from, to, limit } = req.query;
  return {
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
    limit: limit ? Number(limit) : undefined,
  };
}

// GET /api/algo-signals/daily/latest
export const latestDaily = asyncHandler(async (_req: Request, res: Response) => {
  const doc = await getLatestDailySignal();
  sendSuccess(res, doc, doc ? "Latest daily signal fetched" : "No daily signals yet");
});

// GET /api/algo-signals/daily?from=&to=&limit=
export const listDaily = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listDailySignals(parseRange(req)), "Daily signals fetched");
});

// GET /api/algo-signals/weekly/latest
export const latestWeekly = asyncHandler(async (_req: Request, res: Response) => {
  const doc = await getLatestWeeklySignal();
  sendSuccess(res, doc, doc ? "Latest weekly signal fetched" : "No weekly signals yet");
});

// GET /api/algo-signals/weekly?from=&to=&limit=
export const listWeekly = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listWeeklySignals(parseRange(req)), "Weekly signals fetched");
});
