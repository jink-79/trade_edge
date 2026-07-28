import express, { Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rate-limit.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

import authRoutes from "./modules/auth/auth.routes";
import mutualFundsRoutes from "./modules/mutual-funds/mutual-funds.routes";
import fundsRoutes from "./modules/funds/funds.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import signalsRoutes from "./modules/signals/signals.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import journalRoutes from "./modules/journal/journal.routes";
import preferencesRoutes from "./modules/preferences/preferences.routes";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// Keep a tight 10kb limit everywhere EXCEPT /api/journal, whose payloads carry
// base64 chart screenshots and are parsed with a larger limit in that router.
const skipJournal =
  (parser: express.RequestHandler): express.RequestHandler =>
  (req, res, next) =>
    req.path.startsWith("/api/journal") ? next() : parser(req, res, next);

app.use(skipJournal(express.json({ limit: "10kb" })));
app.use(
  skipJournal(express.urlencoded({ extended: true, limit: "10kb" })),
);

app.use(globalRateLimiter);

if (env.NODE_ENV === "development") {
  app.use((req: Request, _res: Response, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/mutual-funds", mutualFundsRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/signals", signalsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/preferences", preferencesRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorMiddleware);

export default app;
