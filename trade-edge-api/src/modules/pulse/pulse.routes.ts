import { Router } from "express";
import express from "express";
import {
  saveScan,
  latestScan,
  savePerf,
  getPerf,
  variants,
  saveWeeks,
  weeks,
  weekByDate,
  saveScorecard,
  scorecard,
  saveTrades,
  tradeLog,
} from "./pulse.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  SavePulseScanSchema,
  SavePulsePerformanceSchema,
  SavePulseWeeksSchema,
  SaveSymbolScorecardSchema,
  SavePulseTradeLogSchema,
} from "./pulse.types";

const router = Router();

// Snapshots carry equity curves + full candidate lists — allow a larger body.
// (The global parser skips /api/pulse; see app.ts.)
router.use(express.json({ limit: "10mb" }));
router.use(authMiddleware);

// POST /api/pulse/scan  — store a weekend scan run (candidates + exits)
router.post("/scan", validate(SavePulseScanSchema), saveScan);

// GET /api/pulse/scan  — latest run (?variant=)
router.get("/scan", latestScan);

// POST /api/pulse/performance  — store/replace a variant's backtest snapshot
router.post("/performance", validate(SavePulsePerformanceSchema), savePerf);

// GET /api/pulse/performance  — snapshots (all variants, or ?variant=)
router.get("/performance", getPerf);

// GET /api/pulse/variants  — variant list + headline stats (side-by-side)
router.get("/variants", variants);

// POST /api/pulse/weeks  — store a variant's per-week blotter timeline (courier)
router.post("/weeks", validate(SavePulseWeeksSchema), saveWeeks);

// GET /api/pulse/weeks  — lightweight week summaries (?variant=) for the picker
router.get("/weeks", weeks);

// GET /api/pulse/weeks/:date  — full blotter for the week containing :date
router.get("/weeks/:date", weekByDate);

// POST /api/pulse/symbol-stats  — store/replace a universe's symbol scorecard
router.post("/symbol-stats", validate(SaveSymbolScorecardSchema), saveScorecard);

// GET /api/pulse/symbol-stats  — latest scorecard (?variant=tracked|fno)
router.get("/symbol-stats", scorecard);

// POST /api/pulse/trade-log  — bulk-replace a variant's full trade log
router.post("/trade-log", validate(SavePulseTradeLogSchema), saveTrades);

// GET /api/pulse/trade-log  — paginated trade log (?variant=&page=&pageSize=&symbol=)
router.get("/trade-log", tradeLog);

export default router;
