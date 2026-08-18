import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { runDailyNewsletter } from "./newsletter.service";

// GET /api/newsletter/run — called by Vercel Cron (no logged-in user), auth
// is the CRON_SECRET bearer token checked in the route middleware.
export const run = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await runDailyNewsletter();
  sendSuccess(res, summary, "Newsletter run complete");
});
