import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { AppError } from "../../utils/api-error";
import { getCalendarEvents, getCalendarBenchmarks } from "./calendar.service";

function parseYearMonth(req: Request): { year: number; month: number } {
  const now = new Date();
  const year = req.query.year != null ? Number(req.query.year) : now.getFullYear();
  const month = req.query.month != null ? Number(req.query.month) : now.getMonth();
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    throw AppError.badRequest("year and month (0-indexed, 0-11) must be valid integers");
  }
  return { year, month };
}

export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { year, month } = parseYearMonth(req);
  const result = await getCalendarEvents(userId, year, month);
  sendSuccess(res, result, "Calendar events loaded");
});

export const getBenchmarks = asyncHandler(async (req: Request, res: Response) => {
  const { year, month } = parseYearMonth(req);
  const result = await getCalendarBenchmarks(year, month);
  sendSuccess(res, result, "Calendar benchmarks loaded");
});
