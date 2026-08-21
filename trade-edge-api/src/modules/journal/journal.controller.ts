import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess, sendCreated } from "../../utils/api-response";
import {
  createJournalTrade,
  createManualTrendTrade,
  getJournalTrades,
  getJournalTradeById,
  exitJournalTrade,
  getExitSummaryPreview,
  autoCreateJournalTrade,
  getAiReviewForTrade,
  backfillPositionMeta,
  reviewJournalTrade,
  setGttPlaced,
  analyzeJournalTrade,
  setRuleAdherence,
} from "./journal.service";
import type {
  AnalyzeTradeInput,
  AutoCaptureInput,
  CreateJournalTradeInput,
  ExitJournalTradeInput,
  ExitSummaryInput,
  GttPlacedInput,
  ManualEntryInput,
  ReviewJournalTradeInput,
  SetAdherenceInput,
} from "./journal.types";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as CreateJournalTradeInput;
  const trade = await createJournalTrade(userId, input);
  sendCreated(res, trade, "Trade logged successfully");
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const trades = await getJournalTrades(userId);
  sendSuccess(res, trades, "Journal trades fetched successfully");
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const trade = await getJournalTradeById(userId, id);
  sendSuccess(res, trade, "Journal trade fetched successfully");
});

export const exit = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const input = req.body as ExitJournalTradeInput;
  const trade = await exitJournalTrade(userId, id, input);
  sendSuccess(res, trade, "Exit recorded — trade closed");
});

export const exitSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const input = req.body as ExitSummaryInput;
  const result = await getExitSummaryPreview(userId, id, input);
  sendSuccess(res, result, "Exit summary generated");
});

export const autoCreate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as AutoCaptureInput;
  const trade = await autoCreateJournalTrade(userId, input);
  sendCreated(res, trade, "Trade auto-captured — add screenshot & comment");
});

export const manualEntry = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as ManualEntryInput;
  const trade = await createManualTrendTrade(userId, input);
  sendCreated(res, trade, "Position added");
});

export const aiReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const result = await getAiReviewForTrade(userId, id);
  sendSuccess(res, result, "AI review fetched");
});

export const backfillMeta = asyncHandler(async (_req: Request, res: Response) => {
  const result = await backfillPositionMeta();
  sendSuccess(res, result, "Backfill complete");
});

export const review = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const input = req.body as ReviewJournalTradeInput;
  const trade = await reviewJournalTrade(userId, id, input);
  sendSuccess(res, trade, "Trade reviewed");
});

export const gttPlaced = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const { placed } = req.body as GttPlacedInput;
  const trade = await setGttPlaced(userId, id, placed);
  sendSuccess(res, trade, "GTT status updated");
});

export const analyze = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const input = req.body as AnalyzeTradeInput;
  const trade = await analyzeJournalTrade(userId, id, input);
  sendSuccess(res, trade, "Trade analytics computed");
});

export const adherence = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const input = req.body as SetAdherenceInput;
  const trade = await setRuleAdherence(userId, id, input);
  sendSuccess(res, trade, "Rule adherence updated");
});
