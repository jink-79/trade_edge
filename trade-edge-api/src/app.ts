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
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import journalRoutes from "./modules/journal/journal.routes";
import preferencesRoutes from "./modules/preferences/preferences.routes";
import scannerRoutes from "./modules/scanner/scanner.routes";
import pulseRoutes from "./modules/pulse/pulse.routes";

const app = express();

const allowedOrigins = env.CLIENT_URL.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// Journal & scanner payloads carry base64 screenshots / candle arrays; their
// own routers parse with a larger limit. Everything else stays tight at 10kb.
const skipLargeBody =
  (parser: express.RequestHandler): express.RequestHandler =>
  (req, res, next) =>
    req.path.startsWith("/api/journal") ||
    req.path.startsWith("/api/scanner") ||
    req.path.startsWith("/api/pulse")
      ? next()
      : parser(req, res, next);

app.use(skipLargeBody(express.json({ limit: "10kb" })));
app.use(skipLargeBody(express.urlencoded({ extended: true, limit: "10kb" })));

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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/pulse", pulseRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorMiddleware);

export default app;
