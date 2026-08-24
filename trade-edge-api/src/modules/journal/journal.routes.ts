import { Router } from "express";
import express from "express";
import {
  create,
  getAll,
  getOne,
  exit,
  exitSummary,
  autoCreate,
  manualEntry,
  aiReview,
  chart,
  strength,
  indicators,
  insight,
  backfillMeta,
  refreshMarks,
  review,
  gttPlaced,
  analyze,
  adherence,
  saveNote,
  aiNote,
} from "./journal.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireCronSecret } from "../../middleware/cron-auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateJournalTradeSchema,
  ExitJournalTradeSchema,
  ExitSummarySchema,
  AutoCaptureSchema,
  ManualEntrySchema,
  ReviewJournalTradeSchema,
  GttPlacedSchema,
  AnalyzeTradeSchema,
  SetAdherenceSchema,
  SetReviewNoteSchema,
} from "./journal.types";

const router = Router();

// Journal payloads carry base64 chart screenshots — allow a larger body here.
// (The global parser skips /api/journal; see app.ts.)
router.use(express.json({ limit: "10mb" }));

// POST /api/journal/backfill-meta  — one-time maintenance across ALL users'
// open trades, not a single user's action, so it's cron-secret-gated ahead
// of authMiddleware rather than scoped to req.user.
router.post("/backfill-meta", requireCronSecret, backfillMeta);

// GET /api/journal/refresh-marks  — daily mark-price/RS refresh for every
// open position across every user; same cron-secret gate as backfill-meta.
router.get("/refresh-marks", requireCronSecret, refreshMarks);

router.use(authMiddleware);

// POST /api/journal
router.post("/", validate(CreateJournalTradeSchema), create);

// POST /api/journal/auto  — auto-capture from a Kite trade + candles
router.post("/auto", validate(AutoCaptureSchema), autoCreate);

// POST /api/journal/entries  — manual Trend+RS-55 open; candles come from
// phalanx-live's own OHLCV server-side, no Kite session needed
router.post("/entries", validate(ManualEntrySchema), manualEntry);

// GET /api/journal
router.get("/", getAll);

// GET /api/journal/:id
router.get("/:id", getOne);

// GET /api/journal/:id/chart  — OHLCV window (~60 bars pre-entry through
// exit/now) for the trade-detail candlestick chart
router.get("/:id/chart", chart);

// GET /api/journal/:id/strength  — technical strength scorecard (no AI),
// evaluated on the symbol's latest available OHLCV
router.get("/:id/strength", strength);

// GET /api/journal/:id/indicators  — raw EMA/RSI/RS/MACD/ADX/price-action
// readings (not a scorecard), evaluated on the symbol's latest OHLCV
router.get("/:id/indicators", indicators);

// POST /api/journal/:id/exit  — record a full or partial exit
router.post("/:id/exit", validate(ExitJournalTradeSchema), exit);

// POST /api/journal/:id/exit-summary  — on-demand AI note for a draft exit,
// not persisted until the real exit is submitted
router.post("/:id/exit-summary", validate(ExitSummarySchema), exitSummary);

// POST /api/journal/:id/ai-review  — on-demand AI take on a held position
router.post("/:id/ai-review", aiReview);

// POST /api/journal/:id/insight  — comprehensive AI review of a CLOSED
// trade against the strategy's own rules, verified against daily_signals
router.post("/:id/insight", insight);

// POST /api/journal/:id/review  — attach screenshot + comment, clear needs-review
router.post("/:id/review", validate(ReviewJournalTradeSchema), review);

// POST /api/journal/:id/gtt  — mark the target/SL GTT as placed / not
router.post("/:id/gtt", validate(GttPlacedSchema), gttPlaced);

// POST /api/journal/:id/analytics  — MAE/MFE + exit optimizer from candles
router.post("/:id/analytics", validate(AnalyzeTradeSchema), analyze);

// POST /api/journal/:id/adherence  — tag system-following vs discretionary
router.post("/:id/adherence", validate(SetAdherenceSchema), adherence);

// POST /api/journal/:id/note  — save the trader's own edit to the review note
router.post("/:id/note", validate(SetReviewNoteSchema), saveNote);

// POST /api/journal/:id/note/ai  — AI drafts (or refines) the review note
router.post("/:id/note/ai", aiNote);

export default router;
