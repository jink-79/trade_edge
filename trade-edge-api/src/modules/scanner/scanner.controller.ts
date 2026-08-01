import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess, sendCreated } from "../../utils/api-response";
import {
  createBatch,
  uploadSignals,
  listSignals,
  listActiveSignals,
  enrichSignal,
  enrichBySymbol,
  getStats,
  savePerformance,
  getPerformance,
} from "./scanner.service";
import {
  ListSignalsQuerySchema,
  type CreateBatchInput,
  type EnrichSignalInput,
  type SavePerformanceInput,
  type UploadSignalsInput,
  type EnrichBySymbolInput,
} from "./scanner.types";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as CreateBatchInput;
  const result = await createBatch(userId, input);
  sendCreated(res, result, `Tracking ${result.tracked} signals`);
});

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as UploadSignalsInput;
  const result = await uploadSignals(userId, input);
  sendCreated(res, result, `Uploaded ${result.rows} rows`);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const q = ListSignalsQuerySchema.parse(req.query);
  const signals = await listSignals(userId, q);
  sendSuccess(res, signals, "Signals fetched");
});

export const active = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const signals = await listActiveSignals(userId);
  sendSuccess(res, signals, "Active signals fetched");
});

export const enrich = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const input = req.body as EnrichSignalInput;
  const signal = await enrichSignal(userId, id, input);
  sendSuccess(res, signal, "Signal enriched");
});

export const enrichSymbol = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { symbol, candles, indexCandles } = req.body as EnrichBySymbolInput;
  const result = await enrichBySymbol(userId, symbol, candles, indexCandles);
  sendSuccess(res, result, "Symbol enriched");
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await getStats(userId);
  sendSuccess(res, result, "Scanner stats fetched");
});

export const savePerf = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as SavePerformanceInput;
  const result = await savePerformance(userId, input);
  sendSuccess(res, result, "Performance snapshot saved");
});

export const getPerf = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await getPerformance(userId);
  sendSuccess(res, result, "Performance snapshot fetched");
});
