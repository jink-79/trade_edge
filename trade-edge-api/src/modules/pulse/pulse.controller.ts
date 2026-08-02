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
  saveSymbolStats,
  getSymbolStats,
  savePulseTradeLog,
  getPulseTradeLog,
} from "./pulse.service";
import {
  VariantQuerySchema,
  WeeksQuerySchema,
  ScorecardQuerySchema,
  TradeLogQuerySchema,
  type SavePulseScanInput,
  type SavePulsePerformanceInput,
  type SavePulseWeeksInput,
  type SaveSymbolScorecardInput,
  type SavePulseTradeLogInput,
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
  const { variant, from, to } = WeeksQuerySchema.parse(req.query);
  const result = await listWeeks(userId, variant, { from, to });
  sendSuccess(res, result, "Weeks fetched");
});

export const weekByDate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { variant } = VariantQuerySchema.parse(req.query);
  const date = new Date(req.params.date as string);
  const result = await getWeekByDate(userId, date, variant);
  sendSuccess(res, result, "Week fetched");
});

export const saveScorecard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as SaveSymbolScorecardInput;
  const doc = await saveSymbolStats(userId, input);
  sendCreated(
    res,
    doc,
    `Saved symbol scorecard for ${input.universe} (${input.symbols.length} symbols)`,
  );
});

export const scorecard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { variant } = ScorecardQuerySchema.parse(req.query);
  const doc = await getSymbolStats(userId, variant);
  sendSuccess(res, doc, "Symbol scorecard fetched");
});

export const saveTrades = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as SavePulseTradeLogInput;
  const result = await savePulseTradeLog(userId, input);
  sendCreated(res, result, `Saved ${result.rows} trade log rows for ${input.variant}`);
});

export const tradeLog = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { variant, page, pageSize, symbol } = TradeLogQuerySchema.parse(req.query);
  const result = await getPulseTradeLog(userId, variant, { page, pageSize, symbol });
  sendSuccess(res, result, "Trade log fetched");
});
