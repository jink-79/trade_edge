import { Request, Response, NextFunction, Router } from "express";
import { env } from "../../config/env";
import { AppError } from "../../utils/api-error";
import { run } from "./newsletter.controller";

const router = Router();

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
// CRON_SECRET is set as an env var on the project — this is NOT a logged-in
// user, so it's deliberately outside the normal authMiddleware/JWT flow.
function requireCronSecret(req: Request, _res: Response, next: NextFunction): void {
  if (!env.CRON_SECRET) {
    return next(AppError.badRequest("CRON_SECRET is not configured on this deployment"));
  }
  const header = req.headers.authorization;
  if (header !== `Bearer ${env.CRON_SECRET}`) {
    return next(AppError.unauthorized("Invalid or missing cron secret"));
  }
  next();
}

router.get("/run", requireCronSecret, run);

export default router;
