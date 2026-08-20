import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/api-error";

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
 * CRON_SECRET is set as an env var on the project — these routes are called
 * unattended, not by a logged-in user, so this is deliberately outside the
 * normal authMiddleware/JWT flow.
 */
export function requireCronSecret(req: Request, _res: Response, next: NextFunction): void {
  if (!env.CRON_SECRET) {
    return next(AppError.badRequest("CRON_SECRET is not configured on this deployment"));
  }
  const header = req.headers.authorization;
  if (header !== `Bearer ${env.CRON_SECRET}`) {
    return next(AppError.unauthorized("Invalid or missing cron secret"));
  }
  next();
}
