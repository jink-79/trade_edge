import express, { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireCronSecret } from "../../middleware/cron-auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { KiteSyncSchema } from "./broker-sync.types";
import { latestSnapshot, listSnapshots, refreshMarks, sync } from "./broker-sync.controller";

const router = Router();

// This module is excluded from the global 10kb parser (app.ts skipLargeBody)
// since a Kite sync payload carries daily-candle arrays for new symbols.
router.use(express.json({ limit: "5mb" }));

// Cron-only route — deliberately BEFORE authMiddleware below, since it's
// called unattended (Vercel Cron), not by a logged-in user.
router.get("/refresh-marks", requireCronSecret, refreshMarks);

router.use(authMiddleware);

// Fixed paths before any future :param routes.
router.get("/daily-pnl/latest", latestSnapshot);
router.get("/daily-pnl", listSnapshots);
router.post("/kite", validate(KiteSyncSchema), sync);

export default router;
