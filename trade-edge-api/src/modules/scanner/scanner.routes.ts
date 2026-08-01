import { Router } from "express";
import express from "express";
import {
  create,
  upload,
  list,
  active,
  enrich,
  enrichSymbol,
  stats,
  savePerf,
  getPerf,
} from "./scanner.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateBatchSchema,
  UploadSignalsSchema,
  EnrichSignalSchema,
  EnrichBySymbolSchema,
  SavePerformanceSchema,
} from "./scanner.types";

const router = Router();

// Enrich payloads carry daily candle arrays — allow a larger body here.
// (The global parser skips /api/scanner; see app.ts.)
router.use(express.json({ limit: "10mb" }));
router.use(authMiddleware);

// POST /api/scanner/batch  — ingest a nightly Chartink paste
router.post("/batch", validate(CreateBatchSchema), create);

// POST /api/scanner/upload  — bulk ingest a Chartink backtest CSV (many dates)
router.post("/upload", validate(UploadSignalsSchema), upload);

// GET /api/scanner/signals  — list signals (?status= &batchId=)
router.get("/signals", list);

// GET /api/scanner/signals/active  — open signals needing candles (courier)
router.get("/signals/active", active);

// POST /api/scanner/signals/:id/enrich  — supply candles → compute + resolve
router.post("/signals/:id/enrich", validate(EnrichSignalSchema), enrich);

// POST /api/scanner/signals/enrich-symbol  — enrich ALL open signals for a symbol
router.post("/signals/enrich-symbol", validate(EnrichBySymbolSchema), enrichSymbol);

// GET /api/scanner/stats  — cohort KPIs
router.get("/stats", stats);

// POST /api/scanner/performance  — store the nightly backtest snapshot (courier)
router.post("/performance", validate(SavePerformanceSchema), savePerf);

// GET /api/scanner/performance  — latest backtest snapshot (app)
router.get("/performance", getPerf);

export default router;
