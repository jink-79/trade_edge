import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess, sendCreated } from "../../utils/api-response";
import {
  savePulseScan,
  getLatestScan,
  savePulsePerformance,
  listPerformance,
  listVariants,
  savePulseWeeks,
  listWeeks,
  getWeekByDate,
} from "./pulse.service";
import {
  VariantQuerySchema,
  type SavePulseScanInput,
  type SavePulsePerformanceInput,
  type SavePulseWeeksInput,
} from "./pulse.types";

export const saveScan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as SavePulseScanInput;
  const run = await savePulseScan(userId, input);
  sendCreated(
    res,
    run,
    `Saved ${input.candidates?.length ?? 0} candidates for ${input.variant}`,
  );
});

export const latestScan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { variant } = VariantQuerySchema.parse(req.query);
  const run = await getLatestScan(userId, variant);
  sendSuccess(res, run, "Latest scan fetched");
});

export const savePerf = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as SavePulsePerformanceInput;
  const snap = await savePulsePerformance(userId, input);
  sendSuccess(res, snap, `Saved backtest snapshot for ${input.variant}`);
});

export const getPerf = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { variant } = VariantQuerySchema.parse(req.query);
  const snaps = await listPerformance(userId, variant);
  sendSuccess(res, snaps, "Performance snapshots fetched");
});

export const variants = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await listVariants(userId);
  sendSuccess(res, result, "Variants fetched");
});

export const saveWeeks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as SavePulseWeeksInput;
  const result = await savePulseWeeks(userId, input);
  sendCreated(res, result, `Saved ${result.weeks} weeks for ${input.variant}`);
});

export const weeks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { variant } = VariantQuerySchema.parse(req.query);
  const result = await listWeeks(userId, variant);
  sendSuccess(res, result, "Weeks fetched");
});

export const weekByDate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { variant } = VariantQuerySchema.parse(req.query);
  const date = new Date(req.params.date as string);
  const result = await getWeekByDate(userId, date, variant);
  sendSuccess(res, result, "Week fetched");
});
