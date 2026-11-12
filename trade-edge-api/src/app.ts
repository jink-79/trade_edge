import express, { Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rate-limit.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

import authRoutes from "./modules/auth/auth.routes";
import accountsRoutes from "./modules/accounts/accounts.routes";
import possessionsRoutes from "./modules/possessions/possessions.routes";

const app = express();

const allowedOrigins = env.CLIENT_URL.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// The deployed frontend (and its Vercel preview URLs, e.g.
// trade-edge-frontend-git-<branch>-<user>.vercel.app) is always allowed, so a
// new preview deploy doesn't need CLIENT_URL updated each time. Add the exact
// production origin to CLIENT_URL as well for clarity.
const vercelFrontend = /^https:\/\/trade-edge-frontend[\w-]*\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || vercelFrontend.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(globalRateLimiter);

if (env.NODE_ENV === "development") {
  app.use((req: Request, _res: Response, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/possessions", possessionsRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorMiddleware);

export default app;
